import type {
  BoundingBox,
  ElementKind,
  FontProfile,
  Viewport,
} from '@bulwark/domain';
import {
  FontRegistry,
  boxHeight,
  createBox,
  parseColor,
  roundHalfAwayFromZero,
  toHex,
} from '@bulwark/domain';
import {
  createRaster,
  drawGlyphBars,
  encodePng,
  fillRect,
} from '@bulwark/imaging';
import type { Raster } from '@bulwark/imaging';
import type {
  DetectionResult,
  LiveCapture,
  LiveDomElement,
  TextRenderResult,
} from '@bulwark/ports';

/**
 * Builds a matched pair of surfaces — a design raster and a live capture — from one
 * declarative description.
 *
 * Real inputs cannot be used to prove the math: nobody can say what the "true"
 * font size of a screenshot is. Here the intent is declared first and the pixels are
 * generated from it, so a test can assert that the pipeline recovers exactly the
 * values that went in, and that the only defects reported are the ones deliberately
 * introduced.
 */

export interface SceneTextSpec {
  readonly content: string;
  readonly fontFamily: string;
  readonly fontSizePx: number;
  readonly fontWeight: number;
  readonly color: string;
}

export interface SceneElementSpec {
  readonly id: string;
  readonly box: readonly [number, number, number, number];
  readonly kind: ElementKind;
  readonly label: string;
  readonly background: string;
  readonly text?: SceneTextSpec;
  /** DOM path reported for the live counterpart; defaults to the id. */
  readonly domId?: string;
  readonly tagName?: string;
}

export interface SceneSpec {
  readonly width: number;
  readonly height: number;
  readonly pageBackground: string;
  readonly elements: readonly SceneElementSpec[];
}

export interface Scene {
  readonly spec: SceneSpec;
  readonly raster: Raster;
  readonly png: Uint8Array;
  readonly detection: DetectionResult;
}

export interface BuildLiveCaptureOptions {
  readonly url?: string;
  readonly viewport?: Viewport;
  readonly engine?: string;
}

const DEFAULT_VIEWPORT: Viewport = { width: 1440, height: 900, deviceScaleFactor: 1 };

/**
 * Stroke geometry that lands a synthetic glyph run inside a given weight band.
 *
 * Density inside the tight ink box is `n*w / (n*w + (n-1)*g)`, so the pair below is
 * chosen to sit clearly inside the 400 and 700 bands rather than near a boundary.
 */
export function strokeGeometryForWeight(weight: number): { strokeWidth: number; gap: number } {
  return weight >= 600 ? { strokeWidth: 4, gap: 4 } : { strokeWidth: 2, gap: 8 };
}

export function buildScene(
  spec: SceneSpec,
  registry: FontRegistry = new FontRegistry(),
): Scene {
  const raster = createRaster(spec.width, spec.height, parseColor(spec.pageBackground));

  for (const element of spec.elements) {
    const box = createBox(...element.box);
    fillRect(raster, box, parseColor(element.background));
    if (element.text !== undefined) {
      drawTextInk(raster, box, element.text, registry.get(element.text.fontFamily));
    }
  }

  const png = encodePng(raster);
  return {
    spec,
    raster,
    png,
    detection: {
      regions: spec.elements.map((element) => ({
        box: createBox(...element.box),
        label: element.label,
        kind: element.kind,
        confidence: 0.9,
        ...(element.text === undefined ? {} : { text: element.text.content }),
      })),
      imageWidth: spec.width,
      imageHeight: spec.height,
      model: 'scene-builder',
    },
  };
}

/** Live capture whose computed styles match the scene's declared intent. */
export function buildLiveCapture(scene: Scene, options: BuildLiveCaptureOptions = {}): LiveCapture {
  const viewport = options.viewport ?? DEFAULT_VIEWPORT;
  const elements: LiveDomElement[] = scene.spec.elements.map((element, index) => ({
    id: element.domId ?? element.id,
    tagName: element.tagName ?? (element.text === undefined ? 'div' : 'p'),
    box: createBox(...element.box),
    text: element.text?.content ?? null,
    style: {
      fontFamily: element.text === undefined ? 'system-ui' : `"${element.text.fontFamily}", sans-serif`,
      fontSizePx: element.text?.fontSizePx ?? 16,
      fontWeight: element.text?.fontWeight ?? 400,
      lineHeightPx: element.text === undefined ? null : element.text.fontSizePx * 1.5,
      letterSpacingPx: 0,
      color: element.text?.color ?? '#000000',
      backgroundColor: toHex(parseColor(element.background)),
      borderRadiusPx: 0,
      opacity: 1,
    },
    hasTransparentBackground: false,
    depth: index + 1,
  }));

  return {
    screenshot: scene.png,
    elements,
    viewport,
    imageWidth: scene.spec.width,
    imageHeight: scene.spec.height,
    url: options.url ?? 'http://localhost:4173/',
    engine: options.engine ?? 'fake-engine 1.0',
  };
}

/**
 * Reference renders for the font-family check.
 *
 * The declared family reproduces the design's own stroke geometry; every other family
 * gets a deliberately different one, which is what a real typeface substitution looks
 * like to a structural comparison.
 */
export function buildReferenceRenders(options: {
  readonly text: string;
  readonly designFamily: string;
  readonly candidateFamilies: readonly string[];
  readonly fontSizePx: number;
  readonly fontWeight: number;
  readonly registry?: FontRegistry;
}): Map<string, TextRenderResult> {
  const registry = options.registry ?? new FontRegistry();
  const renders = new Map<string, TextRenderResult>();

  for (const family of options.candidateFamilies) {
    const profile = registry.get(family);
    const isDesignFamily = family === options.designFamily;
    const geometry = strokeGeometryForWeight(options.fontWeight);
    const inkHeight = inkHeightFor(options.fontSizePx, registry.get(options.designFamily));

    const raster = renderGlyphRun({
      text: options.text,
      inkHeight,
      strokeWidth: isDesignFamily ? geometry.strokeWidth : geometry.strokeWidth + 3,
      gap: isDesignFamily ? geometry.gap : Math.max(1, geometry.gap - 4),
      color: '#111827',
      background: '#ffffff',
    });

    renders.set(`${family}::${options.text}`, {
      image: encodePng(raster),
      width: raster.width,
      height: raster.height,
      resolvedFontFamily: profile.family,
    });
  }

  return renders;
}

/** Ink height that encodes a CSS font size for a family, per its calibrated ratio. */
export function inkHeightFor(fontSizePx: number, profile: FontProfile): number {
  return roundHalfAwayFromZero(fontSizePx * profile.visualToCssRatio);
}

function drawTextInk(
  raster: Raster,
  box: BoundingBox,
  text: SceneTextSpec,
  profile: FontProfile,
): void {
  const inkHeight = inkHeightFor(text.fontSizePx, profile);
  const geometry = strokeGeometryForWeight(text.fontWeight);
  const strokeCount = Math.max(2, text.content.replace(/\s+/g, '').length);
  const availableHeight = boxHeight(box);
  if (inkHeight > availableHeight) {
    throw new RangeError(
      `Scene element box is ${availableHeight}px tall but ${text.fontSizePx}px ` +
        `${profile.family} needs ${inkHeight}px of ink`,
    );
  }

  const top = box.yMin + Math.floor((availableHeight - inkHeight) / 2);
  drawGlyphBars(raster, {
    x: box.xMin + 8,
    y: top,
    height: inkHeight,
    strokeWidth: geometry.strokeWidth,
    gap: geometry.gap,
    count: strokeCount,
    color: parseColor(text.color),
  });
}

function renderGlyphRun(options: {
  readonly text: string;
  readonly inkHeight: number;
  readonly strokeWidth: number;
  readonly gap: number;
  readonly color: string;
  readonly background: string;
}): Raster {
  const strokeCount = Math.max(2, options.text.replace(/\s+/g, '').length);
  const width = strokeCount * options.strokeWidth + (strokeCount - 1) * options.gap + 16;
  const height = options.inkHeight + 12;
  const raster = createRaster(width, height, parseColor(options.background));

  drawGlyphBars(raster, {
    x: 8,
    y: 6,
    height: options.inkHeight,
    strokeWidth: options.strokeWidth,
    gap: options.gap,
    count: strokeCount,
    color: parseColor(options.color),
  });

  return raster;
}

/** Applies edits to a scene spec, the way a regression edits an implementation. */
export function mutateScene(
  spec: SceneSpec,
  edits: Readonly<Record<string, Partial<SceneElementSpec>>>,
): SceneSpec {
  return {
    ...spec,
    elements: spec.elements.map((element) => {
      const edit = edits[element.id];
      if (edit === undefined) return element;
      const merged: SceneElementSpec = { ...element, ...edit };
      if (edit.text !== undefined && element.text !== undefined) {
        return { ...merged, text: { ...element.text, ...edit.text } };
      }
      return merged;
    }),
  };
}

/** Moves an element by a pixel offset, producing a layout shift. */
export function shiftElement(
  element: SceneElementSpec,
  dx: number,
  dy: number,
): Partial<SceneElementSpec> {
  return {
    box: [element.box[0] + dx, element.box[1] + dy, element.box[2] + dx, element.box[3] + dy],
  };
}
