import type { BoundingBox } from '../geometry/box.js';
import { boxHeight } from '../geometry/box.js';
import type {
  Defect,
  FontFamilyDefect,
  FontSizeDefect,
  FontWeightDefect,
} from '../defects/defect.js';
import type { FontFamilyCandidateScore } from '../typography/font-metrics.js';
import {
  classifyFontWeight,
  deriveCssFontSize,
  selectFontFamily,
} from '../typography/font-metrics.js';
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
  /**
   * Optional CSS size recovered by render-and-match (SSIM sweep). When present and
   * confident, {@link checkTypography} prefers it over ink÷ratio.
   */
  readonly sizeFit?: {
    readonly cssFontSizePx: number;
    readonly score: number;
    readonly confident: boolean;
    readonly method: 'render-fit';
  };
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
  /**
   * Reserved for callers that still pass a band margin; adjacent-band weight
   * defects are suppressed via `minWeightGap` instead (see shouldEmitWeightDefect).
   */
  readonly weightBandMargin: number;
  /** Always report weight when |expected−actual| is at least this large. */
  readonly minWeightGap: number;
  /**
   * Reject size defects when design ink is shorter than this (CSS px after
   * `designPixelRatio`). Tiny ink usually means a clipped / chrome-heavy crop.
   */
  readonly minInkHeightPx: number;
  /**
   * For |live−expected| below {@link largeSizeDeltaPx}, require
   * ink÷designBoxHeight ≥ this fill before emitting a size defect.
   */
  readonly minInkBoxFill: number;
  /**
   * Seed-scale disagreements may use a looser fill floor
   * ({@link minInkBoxFillLargeDelta}) so planted heading bugs still fire on
   * slightly padded line boxes.
   */
  readonly largeSizeDeltaPx: number;
  /** Fill floor when |delta| ≥ {@link largeSizeDeltaPx}. */
  readonly minInkBoxFillLargeDelta: number;
}

export const DEFAULT_TYPOGRAPHY_CHECK_OPTIONS: TypographyCheckOptions = {
  fontSizeTolerancePx: 3,
  minFamilyMargin: 0.02,
  designPixelRatio: 1,
  checkFontWeight: true,
  checkFontFamily: true,
  weightBandMargin: 0.04,
  /** Δ200 (one CSS weight step ×2) is mostly density jitter; require a full 300 gap. */
  minWeightGap: 300,
  minInkHeightPx: 6,
  minInkBoxFill: 0.45,
  largeSizeDeltaPx: 6,
  minInkBoxFillLargeDelta: 0.35,
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
  /** How expectedCssFontSizePx was produced. */
  readonly sizeEstimateMethod: 'ink-ratio' | 'render-fit';
  /** False when a size delta existed but the design crop looked unreliable. */
  readonly inkSizeReliable: boolean;
}

export interface TypographyCheckResult {
  readonly findings: readonly TypographyFinding[];
  readonly sizeDefects: readonly FontSizeDefect[];
  readonly weightDefects: readonly FontWeightDefect[];
  readonly familyDefects: readonly FontFamilyDefect[];
  /** Measurements skipped because the live font family is not in the registry. */
  readonly skipped: readonly { measurement: TextMeasurement; reason: string }[];
  /** Size deltas suppressed because the design ink crop looked unreliable. */
  readonly unreliableSize: readonly { measurement: TextMeasurement; reason: string }[];
  /** Unique live stacks that were undeclared (for diagnostics; not per-node defects). */
  readonly undeclaredStacks: readonly string[];
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
  const unreliableSize: { measurement: TextMeasurement; reason: string }[] = [];
  const undeclaredStacks = new Set<string>();
  const undeclaredFamilyEmitted = new Set<string>();

  for (const measurement of measurements) {
    const liveProfile = registry.resolveStack(measurement.live.fontFamilyStack);
    const selection =
      measurement.familyScores.length > 0
        ? selectFontFamily(measurement.familyScores, options.minFamilyMargin)
        : null;

    const declaredSelection =
      selection !== null && selection.confident
        ? registry.find(selection.family)
        : undefined;

    // Undeclared live: never invent ratios from a random default outside the host
    // registry. Prefer a confident SSIM winner; otherwise fall back to the first
    // declared profile so intentional swaps (Georgia vs brand) still get size/weight
    // when the rasterizer is off. Family defects for undeclared stacks are emitted
    // once per unique stack (not once per node).
    if (liveProfile === undefined) {
      undeclaredStacks.add(measurement.live.fontFamilyStack);
      const fallbackProfile =
        declaredSelection ?? (registry.profiles.length > 0 ? registry.profiles[0]! : null);
      if (fallbackProfile !== null) {
        const emitFamily =
          options.checkFontFamily && !undeclaredFamilyEmitted.has(measurement.live.fontFamilyStack);
        if (emitFamily) undeclaredFamilyEmitted.add(measurement.live.fontFamilyStack);
        emitMeasuredDefects({
          measurement,
          sizeWeightProfile: fallbackProfile,
          familyLabel: declaredSelection?.family ?? fallbackProfile.family,
          selection,
          liveProfile: undefined,
          actualFamily: measurement.live.fontFamilyStack,
          findings,
          sizeDefects,
          weightDefects,
          familyDefects,
          unreliableSize,
          options,
          emitFamilyBecauseUndeclared: emitFamily,
        });
      } else {
        skipped.push({
          measurement,
          reason:
            `font stack "${measurement.live.fontFamilyStack}" is not in the host font registry ` +
            `and no declared profiles are configured, so size/weight were skipped`,
        });
      }
      continue;
    }

    // Size/weight use the live declared face so SSIM mistakes don't warp the ratio.
    // Family identity still comes from reference-render scores when confident.
    emitMeasuredDefects({
      measurement,
      sizeWeightProfile: liveProfile,
      familyLabel:
        declaredSelection !== undefined ? declaredSelection.family : liveProfile.family,
      selection,
      liveProfile,
      actualFamily: liveProfile.family,
      findings,
      sizeDefects,
      weightDefects,
      familyDefects,
      unreliableSize,
      options,
      emitFamilyBecauseUndeclared: false,
    });
  }

  return {
    findings,
    sizeDefects,
    weightDefects,
    familyDefects,
    skipped,
    unreliableSize,
    undeclaredStacks: [...undeclaredStacks].sort(),
  };
}

export function typographyDefects(result: TypographyCheckResult): readonly Defect[] {
  return [...result.sizeDefects, ...result.weightDefects, ...result.familyDefects];
}

/**
 * True when design ink weight clearly disagrees with live CSS weight.
 *
 * Adjacent-band jitter (Δ100) and even Δ200 (400↔600 from density noise) dominate
 * false positives. Emit only when |expected−actual| ≥ minWeightGap (default 300).
 *
 * `weightBandMargin` is retained on the options object for callers/config symmetry
 * with the size gate; adjacent gaps never consult it.
 */
export function shouldEmitWeightDefect(
  _strokeDensity: number,
  expectedWeight: number,
  actualWeight: number,
  _profile: FontProfile,
  options: Pick<TypographyCheckOptions, 'weightBandMargin' | 'minWeightGap'> = {
    weightBandMargin: DEFAULT_TYPOGRAPHY_CHECK_OPTIONS.weightBandMargin,
    minWeightGap: DEFAULT_TYPOGRAPHY_CHECK_OPTIONS.minWeightGap,
  },
): boolean {
  if (expectedWeight === actualWeight) return false;
  return Math.abs(expectedWeight - actualWeight) >= options.minWeightGap;
}

/**
 * Whether a size delta should be trusted given how much ink the design crop held.
 *
 * Small deltas need a healthy ink÷box fill (partial labels / button chrome look like
 * 4–5px size bugs). Seed-scale deltas (|Δ| ≥ largeSizeDeltaPx) may use a looser fill
 * so real heading drops still fire on padded line boxes.
 */
export function assessInkSizeReliability(
  measurement: Pick<TextMeasurement, 'visualHeightPx' | 'designBox' | 'live'>,
  expectedCssFontSizePx: number,
  options: Pick<
    TypographyCheckOptions,
    | 'designPixelRatio'
    | 'minInkHeightPx'
    | 'minInkBoxFill'
    | 'largeSizeDeltaPx'
    | 'minInkBoxFillLargeDelta'
  >,
): { reliable: boolean; reason: string } {
  const inkCssPx = measurement.visualHeightPx / options.designPixelRatio;
  if (inkCssPx < options.minInkHeightPx) {
    return {
      reliable: false,
      reason:
        `design ink height ${roundTo(inkCssPx, 2)}px is below the ${options.minInkHeightPx}px ` +
        `reliability floor (likely a clipped or chrome-heavy crop)`,
    };
  }

  const height = boxHeight(measurement.designBox);
  const fill = height > 0 ? measurement.visualHeightPx / height : 1;
  const absDelta = Math.abs(measurement.live.fontSizePx - expectedCssFontSizePx);
  const minFill =
    absDelta >= options.largeSizeDeltaPx
      ? options.minInkBoxFillLargeDelta
      : options.minInkBoxFill;

  if (fill < minFill) {
    return {
      reliable: false,
      reason:
        `design ink fills ${formatPercent(fill)} of its ${roundTo(height, 1)}px box ` +
        `(need ≥ ${formatPercent(minFill)} for a ${roundTo(absDelta, 1)}px size delta)`,
    };
  }

  return { reliable: true, reason: '' };
}

function emitMeasuredDefects(input: {
  readonly measurement: TextMeasurement;
  readonly sizeWeightProfile: FontProfile;
  readonly familyLabel: string;
  readonly selection: ReturnType<typeof selectFontFamily> | null;
  readonly liveProfile: FontProfile | undefined;
  readonly actualFamily: string;
  readonly findings: TypographyFinding[];
  readonly sizeDefects: FontSizeDefect[];
  readonly weightDefects: FontWeightDefect[];
  readonly familyDefects: FontFamilyDefect[];
  readonly unreliableSize: { measurement: TextMeasurement; reason: string }[];
  readonly options: TypographyCheckOptions;
  readonly emitFamilyBecauseUndeclared: boolean;
}): void {
  const {
    measurement,
    sizeWeightProfile,
    familyLabel,
    selection,
    liveProfile,
    actualFamily,
    findings,
    sizeDefects,
    weightDefects,
    familyDefects,
    unreliableSize,
    options,
    emitFamilyBecauseUndeclared,
  } = input;

  const inkCssFontSizePx = deriveCssFontSize(
    measurement.visualHeightPx,
    sizeWeightProfile,
    options.designPixelRatio,
  );
  const useFit =
    measurement.sizeFit !== undefined &&
    measurement.sizeFit.confident &&
    measurement.sizeFit.method === 'render-fit';
  const expectedCssFontSizePx = useFit ? measurement.sizeFit!.cssFontSizePx : inkCssFontSizePx;
  const sizeEstimateMethod = useFit ? ('render-fit' as const) : ('ink-ratio' as const);
  const actualCssFontSizePx = measurement.live.fontSizePx;
  const fontSizeDeltaPx = roundTo(actualCssFontSizePx - expectedCssFontSizePx, 4);
  const expectedFontWeight = classifyFontWeight(measurement.strokeDensity, sizeWeightProfile);

  const reliability = assessInkSizeReliability(measurement, expectedCssFontSizePx, options);

  findings.push({
    designElementId: measurement.designElementId,
    liveElementId: measurement.liveElementId,
    text: measurement.text,
    expectedFamily: familyLabel,
    expectedFamilyConfident: selection?.confident ?? false,
    familyMargin: selection?.margin ?? 0,
    expectedCssFontSizePx,
    actualCssFontSizePx,
    fontSizeDeltaPx,
    expectedFontWeight,
    actualFontWeight: measurement.live.fontWeight,
    strokeDensity: roundTo(measurement.strokeDensity, 6),
    visualHeightPx: roundTo(measurement.visualHeightPx, 4),
    visualToCssRatio: sizeWeightProfile.visualToCssRatio,
    actualFamily,
    sizeEstimateMethod,
    inkSizeReliable: reliability.reliable,
  });

  if (Math.abs(fontSizeDeltaPx) > options.fontSizeTolerancePx) {
    if (!reliability.reliable) {
      unreliableSize.push({ measurement, reason: reliability.reason });
    } else {
      sizeDefects.push({
        id: `font-size:${measurement.designElementId}`,
        type: 'font-size',
        severity: 'error',
        message: useFit
          ? `"${truncate(measurement.text)}" should render at ${expectedCssFontSizePx}px ` +
            `(render-fit score ${roundTo(measurement.sizeFit!.score, 3)} in ${sizeWeightProfile.family}) ` +
            `but the browser reports ${actualCssFontSizePx}px`
          : `"${truncate(measurement.text)}" should render at ${expectedCssFontSizePx}px ` +
            `(${roundTo(measurement.visualHeightPx, 2)}px of ink ÷ ${sizeWeightProfile.visualToCssRatio} ` +
            `${sizeWeightProfile.family} ratio) but the browser reports ${actualCssFontSizePx}px`,
        expectedCssPx: expectedCssFontSizePx,
        actualCssPx: actualCssFontSizePx,
        deltaPx: fontSizeDeltaPx,
        tolerancePx: options.fontSizeTolerancePx,
        measuredVisualHeightPx: roundTo(measurement.visualHeightPx, 4),
        fontFamily: sizeWeightProfile.family,
        visualToCssRatio: sizeWeightProfile.visualToCssRatio,
        designBox: measurement.designBox,
        liveBox: measurement.liveBox,
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
      });
    }
  }

  if (
    options.checkFontWeight &&
    shouldEmitWeightDefect(
      measurement.strokeDensity,
      expectedFontWeight,
      measurement.live.fontWeight,
      sizeWeightProfile,
      options,
    )
  ) {
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
      fontFamily: sizeWeightProfile.family,
      designBox: measurement.designBox,
      liveBox: measurement.liveBox,
      designElementId: measurement.designElementId,
      liveElementId: measurement.liveElementId,
    });
  }

  if (!options.checkFontFamily) return;

  if (emitFamilyBecauseUndeclared) {
    familyDefects.push({
      id: `font-family:${measurement.designElementId}`,
      type: 'font-family',
      severity: 'warning',
      message:
        selection !== null && selection.confident
          ? `"${truncate(measurement.text)}" matches declared face ${selection.family} ` +
            `(SSIM ${selection.score}) but renders with undeclared stack ` +
            `"${measurement.live.fontFamilyStack}"`
          : `"${truncate(measurement.text)}" renders with undeclared font stack ` +
            `"${measurement.live.fontFamilyStack}" (declared type system: ${sizeWeightProfile.family})`,
      expectedFamily: selection?.confident ? selection.family : sizeWeightProfile.family,
      actualFamily: measurement.live.fontFamilyStack,
      expectedFamilyScore: selection?.score ?? 0,
      actualFamilyScore: 0,
      scoreMargin: selection?.margin ?? 0,
      designBox: measurement.designBox,
      liveBox: measurement.liveBox,
      designElementId: measurement.designElementId,
      liveElementId: measurement.liveElementId,
    });
    return;
  }

  if (
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
  if (options.weightBandMargin < 0) {
    throw new RangeError('checkTypography() requires a non-negative weightBandMargin');
  }
  if (options.minWeightGap < 0) {
    throw new RangeError('checkTypography() requires a non-negative minWeightGap');
  }
  if (options.minInkHeightPx < 0) {
    throw new RangeError('checkTypography() requires a non-negative minInkHeightPx');
  }
  if (options.minInkBoxFill < 0 || options.minInkBoxFill > 1) {
    throw new RangeError('checkTypography() requires minInkBoxFill within [0, 1]');
  }
  if (options.minInkBoxFillLargeDelta < 0 || options.minInkBoxFillLargeDelta > 1) {
    throw new RangeError('checkTypography() requires minInkBoxFillLargeDelta within [0, 1]');
  }
  if (options.largeSizeDeltaPx < 0) {
    throw new RangeError('checkTypography() requires a non-negative largeSizeDeltaPx');
  }
}
