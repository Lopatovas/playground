import type { BoundingBox } from '../geometry/box.js';
import type {
  Defect,
  FontFamilyDefect,
  FontSizeDefect,
  FontWeightDefect,
} from '../defects/defect.js';
import type { FontFamilyCandidateScore } from '../typography/font-metrics.js';
import { classifyFontWeight, deriveCssFontSize, selectFontFamily } from '../typography/font-metrics.js';
import type { FontProfile } from '../typography/font-profile.js';
import { FontRegistry } from '../typography/font-profile.js';
import { roundTo } from '../numeric.js';

/** Computed style values Playwright read from the live element. */
export interface LiveTextStyle {
  readonly fontFamilyStack: string;
  readonly fontSizePx: number;
  readonly fontWeight: number;
}

/**
 * Raster measurements taken from the design crop of one matched text element,
 * paired with what the browser actually renders.
 */
export interface TextMeasurement {
  readonly designElementId: string;
  readonly liveElementId: string;
  readonly designBox: BoundingBox;
  readonly liveBox: BoundingBox;
  readonly text: string;
  /** Ink height of the drawn glyphs, excluding line-height padding. */
  readonly visualHeightPx: number;
  /** Share of ink pixels inside the glyph box, in [0, 1]. */
  readonly strokeDensity: number;
  /** SSIM of the design crop against each candidate family's reference render. */
  readonly familyScores: readonly FontFamilyCandidateScore[];
  readonly live: LiveTextStyle;
}

export interface TypographyCheckOptions {
  /** Derived size may differ from the computed style by this many pixels. */
  readonly fontSizeTolerancePx: number;
  /** Minimum SSIM lead before a family verdict is trusted. */
  readonly minFamilyMargin: number;
  /**
   * Density ratio of the design export relative to the live viewport. A 2x Figma
   * export needs `2` so ink heights convert back to CSS pixels.
   */
  readonly designPixelRatio: number;
  readonly checkFontWeight: boolean;
  readonly checkFontFamily: boolean;
}

export const DEFAULT_TYPOGRAPHY_CHECK_OPTIONS: TypographyCheckOptions = {
  fontSizeTolerancePx: 1,
  minFamilyMargin: 0.02,
  designPixelRatio: 1,
  checkFontWeight: true,
  checkFontFamily: true,
};

export interface TypographyFinding {
  readonly designElementId: string;
  readonly liveElementId: string;
  readonly text: string;
  readonly expectedFamily: string;
  readonly expectedFamilyConfident: boolean;
  readonly familyMargin: number;
  readonly expectedCssFontSizePx: number;
  readonly actualCssFontSizePx: number;
  readonly fontSizeDeltaPx: number;
  readonly expectedFontWeight: number;
  readonly actualFontWeight: number;
  readonly strokeDensity: number;
  readonly visualHeightPx: number;
  readonly visualToCssRatio: number;
  readonly actualFamily: string;
}

export interface TypographyCheckResult {
  readonly findings: readonly TypographyFinding[];
  readonly sizeDefects: readonly FontSizeDefect[];
  readonly weightDefects: readonly FontWeightDefect[];
  readonly familyDefects: readonly FontFamilyDefect[];
  /** Measurements skipped because the live font family is not in the registry. */
  readonly skipped: readonly { measurement: TextMeasurement; reason: string }[];
}

/**
 * Validates size, weight and family for every matched text element.
 *
 * Size uses exact arithmetic against a calibrated per-family constant, so its
 * defects are reported as errors. Weight and family come from ink-density bands and
 * structural similarity — both robust but statistical — so they are reported as
 * warnings, and a family verdict that is too close to call is dropped instead of
 * guessed.
 */
export function checkTypography(
  measurements: readonly TextMeasurement[],
  registry: FontRegistry = new FontRegistry(),
  options: TypographyCheckOptions = DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
): TypographyCheckResult {
  assertOptions(options);

  const findings: TypographyFinding[] = [];
  const sizeDefects: FontSizeDefect[] = [];
  const weightDefects: FontWeightDefect[] = [];
  const familyDefects: FontFamilyDefect[] = [];
  const skipped: { measurement: TextMeasurement; reason: string }[] = [];

  for (const measurement of measurements) {
    const liveProfile = registry.resolveStack(measurement.live.fontFamilyStack);
    const selection =
      measurement.familyScores.length > 0
        ? selectFontFamily(measurement.familyScores, options.minFamilyMargin)
        : null;

    const designProfile = resolveDesignProfile(registry, selection, liveProfile);
    if (designProfile === null) {
      skipped.push({
        measurement,
        reason:
          `neither the live font stack "${measurement.live.fontFamilyStack}" nor the winning ` +
          `reference family is registered, so no visual-to-CSS ratio is known`,
      });
      continue;
    }

    const expectedCssFontSizePx = deriveCssFontSize(
      measurement.visualHeightPx,
      designProfile,
      options.designPixelRatio,
    );
    const actualCssFontSizePx = measurement.live.fontSizePx;
    const fontSizeDeltaPx = roundTo(actualCssFontSizePx - expectedCssFontSizePx, 4);

    const expectedFontWeight = classifyFontWeight(measurement.strokeDensity, designProfile);
    const actualFamily = liveProfile?.family ?? measurement.live.fontFamilyStack;

    findings.push({
      designElementId: measurement.designElementId,
      liveElementId: measurement.liveElementId,
      text: measurement.text,
      expectedFamily: designProfile.family,
      expectedFamilyConfident: selection?.confident ?? false,
      familyMargin: selection?.margin ?? 0,
      expectedCssFontSizePx,
      actualCssFontSizePx,
      fontSizeDeltaPx,
      expectedFontWeight,
      actualFontWeight: measurement.live.fontWeight,
      strokeDensity: roundTo(measurement.strokeDensity, 6),
      visualHeightPx: roundTo(measurement.visualHeightPx, 4),
      visualToCssRatio: designProfile.visualToCssRatio,
      actualFamily,
    });

    if (Math.abs(fontSizeDeltaPx) > options.fontSizeTolerancePx) {
      sizeDefects.push({
        id: `font-size:${measurement.designElementId}`,
        type: 'font-size',
        severity: 'error',
        message:
          `"${truncate(measurement.text)}" should render at ${expectedCssFontSizePx}px ` +
          `(${roundTo(measurement.visualHeightPx, 2)}px of ink ÷ ${designProfile.visualToCssRatio} ` +
          `${designProfile.family} ratio) but the browser reports ${actualCssFontSizePx}px`,
        expectedCssPx: expectedCssFontSizePx,
        actualCssPx: actualCssFontSizePx,
        deltaPx: fontSizeDeltaPx,
        tolerancePx: options.fontSizeTolerancePx,
        measuredVisualHeightPx: roundTo(measurement.visualHeightPx, 4),
        fontFamily: designProfile.family,
        visualToCssRatio: designProfile.visualToCssRatio,
        designBox: measurement.designBox,
        liveBox: measurement.liveBox,
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
      });
    }

    if (options.checkFontWeight && expectedFontWeight !== measurement.live.fontWeight) {
      weightDefects.push({
        id: `font-weight:${measurement.designElementId}`,
        type: 'font-weight',
        severity: 'warning',
        message:
          `"${truncate(measurement.text)}" has ${formatPercent(measurement.strokeDensity)} ink ` +
          `coverage in the design, which is weight ${expectedFontWeight}, but the browser reports ` +
          `${measurement.live.fontWeight}`,
        expectedWeight: expectedFontWeight,
        actualWeight: measurement.live.fontWeight,
        strokeDensity: roundTo(measurement.strokeDensity, 6),
        fontFamily: designProfile.family,
        designBox: measurement.designBox,
        liveBox: measurement.liveBox,
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
      });
    }

    if (
      options.checkFontFamily &&
      selection !== null &&
      selection.confident &&
      liveProfile !== undefined &&
      selection.family !== liveProfile.family
    ) {
      const actualScore =
        measurement.familyScores.find((score) => score.family === liveProfile.family)?.score ?? 0;
      familyDefects.push({
        id: `font-family:${measurement.designElementId}`,
        type: 'font-family',
        severity: 'warning',
        message:
          `"${truncate(measurement.text)}" matches ${selection.family} ` +
          `(SSIM ${selection.score}) better than the rendered ${liveProfile.family} ` +
          `(SSIM ${roundTo(actualScore, 6)})`,
        expectedFamily: selection.family,
        actualFamily: liveProfile.family,
        expectedFamilyScore: selection.score,
        actualFamilyScore: roundTo(actualScore, 6),
        scoreMargin: selection.margin,
        designBox: measurement.designBox,
        liveBox: measurement.liveBox,
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
      });
    }
  }

  return { findings, sizeDefects, weightDefects, familyDefects, skipped };
}

export function typographyDefects(result: TypographyCheckResult): readonly Defect[] {
  return [...result.sizeDefects, ...result.weightDefects, ...result.familyDefects];
}

/**
 * The ratio used for size math must come from the family actually drawn in the
 * design. The reference-render winner is the best evidence for that; the live
 * family is the fallback when the winner is unregistered or too close to call.
 */
function resolveDesignProfile(
  registry: FontRegistry,
  selection: { family: string; confident: boolean } | null,
  liveProfile: FontProfile | undefined,
): FontProfile | null {
  if (selection !== null && selection.confident) {
    const selected = registry.find(selection.family);
    if (selected !== undefined) return selected;
  }
  return liveProfile ?? null;
}

function truncate(text: string, maxLength = 40): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  return collapsed.length <= maxLength ? collapsed : `${collapsed.slice(0, maxLength - 1)}…`;
}

function formatPercent(value: number): string {
  return `${roundTo(value * 100, 1)}%`;
}

function assertOptions(options: TypographyCheckOptions): void {
  if (options.fontSizeTolerancePx < 0) {
    throw new RangeError('checkTypography() requires a non-negative fontSizeTolerancePx');
  }
  if (!(options.designPixelRatio > 0)) {
    throw new RangeError('checkTypography() requires designPixelRatio > 0');
  }
}
