import type {
  BoundingBox,
  ElementPair,
  FontFamilyCandidateScore,
  FontRegistry,
  TextMeasurement,
} from '@bulwark/domain';
import {
  boxArea,
  boxIntersection,
  boxWidth,
  boxHeight,
  classifyFontWeight,
  deriveCssFontSize,
  inflateBox,
  intersectionOverUnion,
  isMeaningfullyTighter,
  mapRelativeBox,
  selectFontFamily,
} from '@bulwark/domain';
import type { GrayImage, Raster, TextInkOptions } from '@bulwark/imaging';
import {
  alignForShapeComparison,
  cropRaster,
  decodePng,
  encodePng,
  measureGlyphShape,
  ssim,
} from '@bulwark/imaging';
import type { Logger, TextRasterizer, TextRecognizer, RecognizedText } from '@bulwark/ports';
import type { SurfaceElement } from '../surface/normalize.js';
import { fitCssFontSize } from './font-size-fit.js';

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
  /**
   * Experimental render-and-match size search. Default false (parked); ink÷ratio is
   * the production size estimate. Rasterizer may still run for family SSIM.
   */
  readonly enableSizeFit?: boolean;
  /**
   * Run the text recognizer once on the full design raster and prefer a page-level
   * text box over the detector crop when it overlaps the matched element. Cuts
   * chrome-heavy and partial ScreenParser boxes for typography only.
   */
  readonly preferPageTextBoxes?: boolean;
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
 * Turns matched pairs into the measurements the typography checks consume.
 *
 * Eligibility is "live DOM node has text", not detector `kind`. OmniParser often
 * labels buttons/CTAs as `container`; gating on `text` alone dropped those type
 * defects entirely.
 *
 * Ink is always measured on the design surface, never on the live screenshot: the
 * live side already reports its font size exactly through the DOM, so measuring its
 * pixels would only add error. The design raster is the one place where the intent
 * exists solely as pixels.
 *
 * Size estimation uses ink÷ratio. Optional render-and-match (`enableSizeFit`) is
 * parked experimental code: when on, a confident declared family can override the
 * ink estimate via a CSS size sweep scored on glyph box width/height.
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
    const enableSizeFit = this.options.enableSizeFit === true;
    const preferPageTextBoxes = this.options.preferPageTextBoxes === true;

    const pageTextBoxes = preferPageTextBoxes
      ? await this.recognizePageTextBoxes(designRaster, warnings)
      : [];

    for (const pair of pairs) {
      const designSurface = designElementsById.get(pair.designElement.id);
      const liveSurface = liveElementsById.get(pair.liveElement.id);
      if (designSurface === undefined || liveSurface === undefined) continue;

      const dom = liveSurface.dom;
      if (dom === undefined) {
        if (pair.designElement.kind === 'text') {
          warnings.push(
            `Skipped typography for "${pair.designElement.label}": no DOM node was associated ` +
              `with the live element`,
          );
        }
        continue;
      }

      const text = dom.text ?? pair.designElement.text ?? '';
      if (text.trim().length === 0) {
        if (pair.designElement.kind === 'text' || pair.designElement.kind === 'icon') {
          warnings.push(
            `Skipped typography for "${pair.designElement.label}": the live node renders no text`,
          );
        }
        continue;
      }

      const refined = refineDesignBoxesForTextLeaf({
        designSourceBox: designSurface.sourceBox,
        designComparisonBox: pair.designElement.box,
        liveVisionBox: pair.liveElement.box,
        liveDomBox: dom.box,
      });

      const pageBox = selectPageTextBox(designSurface.sourceBox, pageTextBoxes, text);
      const cropSourceBox = pageBox ?? refined.sourceBox;
      const crop = cropWithPadding(designRaster, cropSourceBox, this.options.cropPaddingPx);
      const ink = await this.measureInk(crop, pair.designElement.label, warnings);
      if (ink === null) continue;

      const liveProfile = this.deps.registry.resolveStack(dom.style.fontFamily);
      const seedProfile = liveProfile ?? this.deps.registry.profiles[0] ?? null;
      const seedPx =
        seedProfile !== null
          ? deriveCssFontSize(ink.visualHeightPx, seedProfile)
          : Math.max(8, Math.round(ink.visualHeightPx / 0.75));

      const familyScores = await this.scoreFamilies({
        designShape: ink.shape,
        text,
        fontSizePx: seedPx,
        fontWeight: dom.style.fontWeight,
        warnings,
        label: pair.designElement.label,
      });

      let sizeFit: TextMeasurement['sizeFit'];
      // Render-fit needs a declared live face: undeclared stacks (e.g. Georgia swap)
      // would otherwise be fitted with the wrong candidate and invent a size.
      if (
        enableSizeFit &&
        liveProfile !== undefined &&
        familyScores.length > 0 &&
        this.deps.rasterizer !== undefined
      ) {
        const selection = selectFontFamily(familyScores);
        const fitProfile = this.deps.registry.find(selection.family) ?? liveProfile;
        const faceMatchesLive = selection.family === liveProfile.family;
        if (selection.confident && faceMatchesLive) {
          const fitWeight = classifyFontWeight(ink.strokeDensity, fitProfile);
          const designWidthPx = ink.shape.width > 0 ? ink.shape.width : ink.visualHeightPx;
          try {
            const fit = await fitCssFontSize({
              seedPx,
              livePx: dom.style.fontSizePx,
              minScore: 0.2,
              minMargin: 0.06,
              liveSlack: 0.08,
              scoreAt: (sizePx) =>
                this.scoreSizeAgainstDesign({
                  designVisualHeightPx: ink.visualHeightPx,
                  designWidthPx,
                  text,
                  fontFamily: selection.family,
                  fontSizePx: sizePx,
                  fontWeight: fitWeight,
                }),
              scoreMany: async (sizesPx) =>
                this.scoreSizesAgainstDesign({
                  designVisualHeightPx: ink.visualHeightPx,
                  designWidthPx,
                  text,
                  fontFamily: selection.family,
                  fontWeight: fitWeight,
                  sizesPx,
                }),
            });
            sizeFit = {
              cssFontSizePx: fit.cssFontSizePx,
              score: fit.score,
              confident: fit.confident,
              method: 'render-fit',
            };
            this.deps.logger.log('info', 'render-fit font size', {
              label: pair.designElement.label,
              text,
              family: selection.family,
              seedPx,
              livePx: dom.style.fontSizePx,
              fittedPx: fit.cssFontSizePx,
              score: fit.score,
              confident: fit.confident,
              preferredLive: fit.preferredLive,
              evaluations: fit.evaluations,
            });
          } catch (error) {
            warnings.push(
              `Render-fit size search failed for "${pair.designElement.label}": ${describeError(error)}`,
            );
          }
        }
      }

      measurements.push({
        designElementId: pair.designElement.id,
        liveElementId: pair.liveElement.id,
        // Page text boxes also replace the reliability box so fill reflects the
        // glyph crop rather than detector chrome. DOM-only refine still keeps the
        // vision box for fill (see earlier text-leaf experiment).
        designBox:
          pageBox !== null
            ? mapSourceBoxToComparison(
                pageBox,
                designSurface.sourceBox,
                pair.designElement.box,
              )
            : pair.designElement.box,
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
        ...(sizeFit === undefined ? {} : { sizeFit }),
      });
    }

    return { measurements, warnings };
  }

  private async recognizePageTextBoxes(
    designRaster: Raster,
    warnings: string[],
  ): Promise<readonly RecognizedText[]> {
    try {
      const recognized = await this.deps.recognizer.recognize({
        image: encodePng(designRaster),
      });
      this.deps.logger.log('info', 'page text boxes for typography', {
        model: recognized.model,
        runs: recognized.runs.length,
      });
      return recognized.runs;
    } catch (error) {
      warnings.push(`Page text recognition failed; using detector crops: ${describeError(error)}`);
      return [];
    }
  }

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

  private async scoreFamilies(input: {
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

  /**
   * Size-sensitive score: render the string and compare glyph box width/height to
   * the design ink box. Must NOT use {@link alignForShapeComparison} — that path
   * rescales to a common height and erases the size signal (it is for family only).
   *
   * Returns a score in (0, 1] where 1 is a perfect width+height match.
   */
  private async scoreSizeAgainstDesign(input: {
    readonly designVisualHeightPx: number;
    readonly designWidthPx: number;
    readonly text: string;
    readonly fontFamily: string;
    readonly fontSizePx: number;
    readonly fontWeight: number;
  }): Promise<number> {
    const rasterizer = this.deps.rasterizer;
    if (rasterizer === undefined) return Number.NEGATIVE_INFINITY;

    const render = await rasterizer.render({
      text: input.text,
      fontFamily: input.fontFamily,
      fontSizePx: input.fontSizePx,
      fontWeight: input.fontWeight,
      color: '#000000',
      backgroundColor: '#ffffff',
    });

    return scoreRenderBox(render.image, input, this.options.textInk);
  }

  private async scoreSizesAgainstDesign(input: {
    readonly designVisualHeightPx: number;
    readonly designWidthPx: number;
    readonly text: string;
    readonly fontFamily: string;
    readonly fontWeight: number;
    readonly sizesPx: readonly number[];
  }): Promise<ReadonlyMap<number, number>> {
    const rasterizer = this.deps.rasterizer;
    const scores = new Map<number, number>();
    if (rasterizer === undefined) return scores;

    if (rasterizer.renderMany !== undefined) {
      const renders = await rasterizer.renderMany(
        {
          text: input.text,
          fontFamily: input.fontFamily,
          fontWeight: input.fontWeight,
          color: '#000000',
          backgroundColor: '#ffffff',
        },
        input.sizesPx,
      );
      for (const render of renders) {
        scores.set(
          render.fontSizePx,
          scoreRenderBox(render.image, input, this.options.textInk),
        );
      }
      return scores;
    }

    for (const sizePx of input.sizesPx) {
      scores.set(
        sizePx,
        await this.scoreSizeAgainstDesign({
          designVisualHeightPx: input.designVisualHeightPx,
          designWidthPx: input.designWidthPx,
          text: input.text,
          fontFamily: input.fontFamily,
          fontSizePx: sizePx,
          fontWeight: input.fontWeight,
        }),
      );
    }
    return scores;
  }
}

/** Crops with optional padding, letting the raster bounds clip the result. */
export function cropWithPadding(raster: Raster, box: BoundingBox, padding: number): Raster {
  return cropRaster(raster, padding === 0 ? box : inflateBox(box, padding));
}

/**
 * When the associated DOM text leaf is tighter than the live vision box (typical
 * Button chrome), project that leaf onto the matched design box so ink is measured
 * on the label rather than padding / chrome.
 */
export function refineDesignBoxesForTextLeaf(input: {
  readonly designSourceBox: BoundingBox;
  readonly designComparisonBox: BoundingBox;
  readonly liveVisionBox: BoundingBox;
  readonly liveDomBox: BoundingBox;
}): { readonly sourceBox: BoundingBox; readonly comparisonBox: BoundingBox } {
  if (!isMeaningfullyTighter(input.liveVisionBox, input.liveDomBox)) {
    return {
      sourceBox: input.designSourceBox,
      comparisonBox: input.designComparisonBox,
    };
  }

  const sourceBox =
    mapRelativeBox(input.liveVisionBox, input.liveDomBox, input.designSourceBox) ??
    input.designSourceBox;
  const comparisonBox =
    mapRelativeBox(input.liveVisionBox, input.liveDomBox, input.designComparisonBox) ??
    input.designComparisonBox;

  return { sourceBox, comparisonBox };
}

/**
 * Pick a page-level text/OCR box for a detector region.
 *
 * Prefers runs that either sit tightly inside the detector box (chrome) or cover
 * the detector box (partial label). When the recognizer returns text, a token
 * overlap with the live DOM string breaks ties.
 */
export function selectPageTextBox(
  designSourceBox: BoundingBox,
  runs: readonly RecognizedText[],
  liveText: string,
): BoundingBox | null {
  if (runs.length === 0) return null;

  const liveTokens = tokenize(liveText);
  let best: { box: BoundingBox; score: number } | null = null;

  for (const run of runs) {
    const iou = intersectionOverUnion(designSourceBox, run.box);
    const runInDesign = containmentRatio(run.box, designSourceBox);
    const designInRun = containmentRatio(designSourceBox, run.box);
    let score = Math.max(iou, runInDesign, designInRun * 0.85);

    if (liveTokens.length > 0 && run.text.trim().length > 0) {
      const overlap = tokenOverlap(liveTokens, tokenize(run.text));
      score += 0.15 * overlap;
    }

    // Ignore weak associations — random page text shouldn't steal the crop.
    if (score < 0.28) continue;
    // Prefer a box that actually changes the crop (tighter or expanded partial).
    const different =
      isMeaningfullyTighter(designSourceBox, run.box) ||
      isMeaningfullyTighter(run.box, designSourceBox) ||
      designInRun >= 0.7;
    if (!different && iou < 0.85) continue;

    if (best === null || score > best.score) {
      best = { box: run.box, score };
    }
  }

  return best?.box ?? null;
}

/** Maps an image-space source box into comparison space using a known pair of boxes. */
export function mapSourceBoxToComparison(
  sourceBox: BoundingBox,
  referenceSource: BoundingBox,
  referenceComparison: BoundingBox,
): BoundingBox {
  const srcW = boxWidth(referenceSource);
  const srcH = boxHeight(referenceSource);
  const cmpW = boxWidth(referenceComparison);
  const cmpH = boxHeight(referenceComparison);
  if (!(srcW > 0) || !(srcH > 0)) return referenceComparison;

  const scaleX = cmpW / srcW;
  const scaleY = cmpH / srcH;
  if (Math.abs(scaleX - 1) < 1e-6 && Math.abs(scaleY - 1) < 1e-6) {
    return sourceBox;
  }

  const originX = referenceComparison.xMin - referenceSource.xMin * scaleX;
  const originY = referenceComparison.yMin - referenceSource.yMin * scaleY;
  return {
    xMin: originX + sourceBox.xMin * scaleX,
    yMin: originY + sourceBox.yMin * scaleY,
    xMax: originX + sourceBox.xMax * scaleX,
    yMax: originY + sourceBox.yMax * scaleY,
  };
}

function containmentRatio(inner: BoundingBox, outer: BoundingBox): number {
  const area = boxArea(inner);
  if (!(area > 0)) return 0;
  const overlap = boxIntersection(inner, outer);
  if (overlap === null) return 0;
  return boxArea(overlap) / area;
}

function tokenize(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length > 0);
}

function tokenOverlap(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let hits = 0;
  for (const token of a) {
    if (setB.has(token)) hits += 1;
  }
  return hits / Math.max(a.length, b.length);
}

function scoreRenderBox(
  image: Uint8Array,
  design: { readonly designVisualHeightPx: number; readonly designWidthPx: number },
  textInk: TextInkOptions,
): number {
  const reference = measureGlyphShape(decodePng(image), { textInk });
  if (reference === null) return Number.NEGATIVE_INFINITY;

  const renderHeight = reference.measurement.visualHeightPx;
  const renderWidth =
    reference.measurement.tightBox.xMax - reference.measurement.tightBox.xMin + 1;
  const dH = Math.abs(renderHeight - design.designVisualHeightPx);
  const dW = Math.abs(renderWidth - design.designWidthPx);
  return 1 / (1 + dW + 0.5 * dH);
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
