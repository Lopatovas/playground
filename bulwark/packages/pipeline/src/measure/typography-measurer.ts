import type {
  BoundingBox,
  ElementPair,
  FontFamilyCandidateScore,
  FontRegistry,
  TextMeasurement,
} from '@bulwark/domain';
import { inflateBox } from '@bulwark/domain';
import type { GrayImage, Raster, TextInkOptions } from '@bulwark/imaging';
import {
  alignForShapeComparison,
  cropRaster,
  decodePng,
  encodePng,
  measureGlyphShape,
  ssim,
} from '@bulwark/imaging';
import type { Logger, TextRasterizer, TextRecognizer } from '@bulwark/ports';
import type { SurfaceElement } from '../surface/normalize.js';

export interface TypographyMeasurerOptions {
  /**
   * Pixels added around a text box before cropping. Zero by default, and negative
   * values inset instead.
   *
   * Padding is not free: it pulls the parent's background into the crop, and Otsu
   * then separates the page from the element instead of the ink from its own
   * background — which makes white text on a dark button vanish behind the white page
   * beyond its edge.
   */
  readonly cropPaddingPx: number;
  readonly textInk: TextInkOptions;
  /** Families rendered as references for the family check. */
  readonly candidateFamilies: readonly string[];
}

export interface TypographyMeasurerDeps {
  readonly recognizer: TextRecognizer;
  readonly rasterizer?: TextRasterizer;
  readonly registry: FontRegistry;
  readonly logger: Logger;
}

export interface TypographyMeasurementOutcome {
  readonly measurements: readonly TextMeasurement[];
  readonly warnings: readonly string[];
}

/**
 * Turns matched text pairs into the measurements the typography checks consume.
 *
 * Ink is always measured on the design surface, never on the live screenshot: the
 * live side already reports its font size exactly through the DOM, so measuring its
 * pixels would only add error. The design raster is the one place where the intent
 * exists solely as pixels.
 */
export class TypographyMeasurer {
  constructor(
    private readonly deps: TypographyMeasurerDeps,
    private readonly options: TypographyMeasurerOptions,
  ) {}

  async measure(
    pairs: readonly ElementPair[],
    designRaster: Raster,
    designElementsById: ReadonlyMap<string, SurfaceElement>,
    liveElementsById: ReadonlyMap<string, SurfaceElement>,
  ): Promise<TypographyMeasurementOutcome> {
    const measurements: TextMeasurement[] = [];
    const warnings: string[] = [];

    for (const pair of pairs) {
      if (pair.designElement.kind !== 'text') continue;

      const designSurface = designElementsById.get(pair.designElement.id);
      const liveSurface = liveElementsById.get(pair.liveElement.id);
      if (designSurface === undefined || liveSurface === undefined) continue;

      const dom = liveSurface.dom;
      if (dom === undefined) {
        warnings.push(
          `Skipped typography for "${pair.designElement.label}": no DOM node was associated ` +
            `with the live element`,
        );
        continue;
      }

      const text = dom.text ?? pair.designElement.text ?? '';
      if (text.trim().length === 0) {
        warnings.push(
          `Skipped typography for "${pair.designElement.label}": the live node renders no text`,
        );
        continue;
      }

      const crop = cropWithPadding(
        designRaster,
        designSurface.sourceBox,
        this.options.cropPaddingPx,
      );
      const ink = await this.measureInk(crop, pair.designElement.label, warnings);
      if (ink === null) continue;

      const familyScores = await this.scoreFamilies({
        designShape: ink.shape,
        text,
        fontSizePx: dom.style.fontSizePx,
        fontWeight: dom.style.fontWeight,
        warnings,
        label: pair.designElement.label,
      });

      measurements.push({
        designElementId: pair.designElement.id,
        liveElementId: pair.liveElement.id,
        designBox: pair.designElement.box,
        liveBox: pair.liveElement.box,
        text,
        visualHeightPx: ink.visualHeightPx,
        strokeDensity: ink.strokeDensity,
        familyScores,
        live: {
          fontFamilyStack: dom.style.fontFamily,
          fontSizePx: dom.style.fontSizePx,
          fontWeight: dom.style.fontWeight,
        },
      });
    }

    return { measurements, warnings };
  }

  /**
   * Measures glyph height and ink coverage inside a crop.
   *
   * The recognizer runs first because a tight OCR box excludes the leading and
   * trailing whitespace a projection over the whole crop would keep. Its box becomes
   * the region ink is measured in; when it returns nothing, the whole crop is used.
   */
  private async measureInk(
    crop: Raster,
    label: string,
    warnings: string[],
  ): Promise<{ visualHeightPx: number; strokeDensity: number; shape: GrayImage } | null> {
    const recognized = await this.deps.recognizer.recognize({ image: encodePng(crop) });
    const region = recognized.runs[0]?.box;

    if (region === undefined) {
      this.deps.logger.log('debug', 'text recognizer returned no runs; measuring the whole crop', {
        label,
      });
    }

    const measured = measureGlyphShape(crop, {
      ...(region === undefined ? {} : { region }),
      textInk: this.options.textInk,
    });
    if (measured === null) {
      warnings.push(`Skipped typography for "${label}": the design crop contains no ink`);
      return null;
    }

    return {
      visualHeightPx: measured.measurement.visualHeightPx,
      strokeDensity: measured.measurement.strokeDensity,
      shape: measured.shape,
    };
  }

  /**
   * Scores the design crop against a reference render of each candidate family.
   *
   * Returns an empty list when no rasterizer is configured, which makes the family
   * check inert rather than speculative.
   */
  private async scoreFamilies(input: {
    /** Tight, normalised glyph shape from the design crop. */
    readonly designShape: GrayImage;
    readonly text: string;
    readonly fontSizePx: number;
    readonly fontWeight: number;
    readonly warnings: string[];
    readonly label: string;
  }): Promise<readonly FontFamilyCandidateScore[]> {
    const rasterizer = this.deps.rasterizer;
    if (rasterizer === undefined || this.options.candidateFamilies.length === 0) return [];

    const scores: FontFamilyCandidateScore[] = [];

    for (const family of this.options.candidateFamilies) {
      try {
        const render = await rasterizer.render({
          text: input.text,
          fontFamily: family,
          fontSizePx: input.fontSizePx,
          fontWeight: input.fontWeight,
          color: '#000000',
          backgroundColor: '#ffffff',
        });

        if (!render.resolvedFontFamily.startsWith(family)) {
          input.warnings.push(
            `Reference render for "${family}" resolved to ${render.resolvedFontFamily}; ` +
              `install the font or remove it from typography.candidateFamilies`,
          );
        }

        const reference = measureGlyphShape(decodePng(render.image), {
          textInk: this.options.textInk,
        });
        if (reference === null) {
          input.warnings.push(`Reference render for "${family}" contained no ink`);
          continue;
        }

        const [a, b] = alignForShapeComparison(input.designShape, reference.shape);
        scores.push({ family, score: ssim(a, b).score });
      } catch (error) {
        input.warnings.push(
          `Could not render "${input.label}" in ${family}: ${describeError(error)}`,
        );
      }
    }

    return scores;
  }
}

/** Crops with optional padding, letting the raster bounds clip the result. */
export function cropWithPadding(raster: Raster, box: BoundingBox, padding: number): Raster {
  return cropRaster(raster, padding === 0 ? box : inflateBox(box, padding));
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
