import type { BoundingBox } from '../geometry/box.js';
import type { ColorDefect, ColorRole, Defect } from '../defects/defect.js';
import type { Rgb } from '../color/rgb.js';
import { toHex } from '../color/rgb.js';
import { rgbToLab } from '../color/lab.js';
import type { DeltaE2000Weights } from '../color/delta-e.js';
import {
  DEFAULT_DELTA_E_WEIGHTS,
  JUST_NOTICEABLE_DELTA_E,
  deltaE2000Rgb,
} from '../color/delta-e.js';
import { roundTo } from '../numeric.js';

/**
 * Colors extracted for one matched element.
 *
 * Specialized measurers set `compareRoles` so fill checks only ΔE backgrounds and
 * ink checks only ΔE font colors. Palette strategy supplies series stop lists.
 */
export interface ColorMeasurement {
  readonly designElementId: string;
  readonly liveElementId: string;
  readonly designBox: BoundingBox;
  readonly liveBox: BoundingBox;
  readonly label: string;
  readonly designBackground: Rgb;
  readonly liveBackground: Rgb;
  readonly designForeground?: Rgb;
  readonly liveForeground?: Rgb;
  /** Chromatic series stops for chart/palette strategy (pie, donut, mixed). */
  readonly designSeries?: readonly Rgb[];
  readonly liveSeries?: readonly Rgb[];
  /** Detector-driven strategy label for diagnostics (`fill`, `ink`, `palette`). */
  readonly strategy?: string;
  /** Roles the measurer wants compared; defaults to background (+ foreground). */
  readonly compareRoles?: readonly ColorRole[];
}

export interface ColorCheckOptions {
  /** Delta E above which a shade difference is reported for backgrounds. */
  readonly deltaEThreshold: number;
  /**
   * ΔE for chromatic ink (links, accents, prices). Soft planted accents often sit
   * around ΔE 6–9, so this stays lower than the neutral-body threshold.
   */
  readonly inkDeltaEThreshold: number;
  /**
   * ΔE for near-neutral body text. Gray ink is noisier across AA/hinting, so we
   * demand a larger shift before reporting a defect (cuts marketplace-style FPs).
   */
  readonly inkNeutralDeltaEThreshold: number;
  /**
   * Lab chroma C* = hypot(a*, b*). Max(design, live) at or above this uses the
   * chromatic ink threshold; below uses the neutral threshold.
   */
  readonly inkAccentChroma: number;
  /** ΔE for matched chart series stops (pie slices, etc.). */
  readonly seriesDeltaEThreshold: number;
  readonly weights: DeltaE2000Weights;
  readonly checkForeground: boolean;
}

export const DEFAULT_COLOR_CHECK_OPTIONS: ColorCheckOptions = {
  deltaEThreshold: JUST_NOTICEABLE_DELTA_E,
  inkDeltaEThreshold: 5,
  inkNeutralDeltaEThreshold: 13,
  inkAccentChroma: 20,
  seriesDeltaEThreshold: 8,
  weights: DEFAULT_DELTA_E_WEIGHTS,
  checkForeground: true,
};

export interface ColorComparison {
  readonly designElementId: string;
  readonly liveElementId: string;
  readonly role: ColorRole;
  readonly designHex: string;
  readonly liveHex: string;
  readonly deltaE2000: number;
  readonly withinTolerance: boolean;
}

export interface ColorCheckResult {
  readonly comparisons: readonly ColorComparison[];
  readonly defects: readonly ColorDefect[];
}

/** CIE Lab chroma C* — saturated accents score high; gray body text near zero. */
export function labChroma(color: Rgb): number {
  const lab = rgbToLab(color);
  return Math.hypot(lab.a, lab.b);
}

/**
 * Picks the ink ΔE threshold from how chromatic the design/live ink pair is.
 */
export function inkThresholdForPair(
  design: Rgb,
  live: Rgb,
  options: Pick<
    ColorCheckOptions,
    'inkDeltaEThreshold' | 'inkNeutralDeltaEThreshold' | 'inkAccentChroma'
  >,
): number {
  const chroma = Math.max(labChroma(design), labChroma(live));
  return chroma >= options.inkAccentChroma
    ? options.inkDeltaEThreshold
    : options.inkNeutralDeltaEThreshold;
}

/**
 * Greedy 1:1 matching of design series stops to live stops.
 */
export function matchSeriesStops(
  design: readonly Rgb[],
  live: readonly Rgb[],
): readonly { design: Rgb; live: Rgb; deltaE2000: number }[] {
  const used = new Set<number>();
  const matches: { design: Rgb; live: Rgb; deltaE2000: number }[] = [];
  for (const designColor of design) {
    let bestIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let index = 0; index < live.length; index += 1) {
      if (used.has(index)) continue;
      const delta = deltaE2000Rgb(designColor, live[index]!);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    }
    if (bestIndex < 0) continue;
    used.add(bestIndex);
    matches.push({
      design: designColor,
      live: live[bestIndex]!,
      deltaE2000: roundTo(bestDelta, 4),
    });
  }
  return matches;
}

/**
 * Compares design colors against live colors in a perceptual space.
 */
export function checkColors(
  measurements: readonly ColorMeasurement[],
  options: ColorCheckOptions = DEFAULT_COLOR_CHECK_OPTIONS,
): ColorCheckResult {
  if (!(options.deltaEThreshold >= 0)) {
    throw new RangeError('checkColors() requires a non-negative deltaEThreshold');
  }
  if (!(options.inkDeltaEThreshold >= 0)) {
    throw new RangeError('checkColors() requires a non-negative inkDeltaEThreshold');
  }
  if (!(options.inkNeutralDeltaEThreshold >= 0)) {
    throw new RangeError('checkColors() requires a non-negative inkNeutralDeltaEThreshold');
  }
  if (!(options.inkAccentChroma >= 0)) {
    throw new RangeError('checkColors() requires a non-negative inkAccentChroma');
  }
  if (!(options.seriesDeltaEThreshold >= 0)) {
    throw new RangeError('checkColors() requires a non-negative seriesDeltaEThreshold');
  }

  const comparisons: ColorComparison[] = [];
  const defects: ColorDefect[] = [];

  for (const measurement of measurements) {
    const requested =
      measurement.compareRoles ??
      ([
        'background',
        ...(options.checkForeground ? (['foreground'] as const) : []),
      ] as readonly ColorRole[]);

    for (const role of requested) {
      if (role === 'series') {
        const designSeries = measurement.designSeries ?? [];
        const liveSeries = measurement.liveSeries ?? [];
        if (designSeries.length === 0 || liveSeries.length === 0) continue;
        const matches = matchSeriesStops(designSeries, liveSeries);
        for (const [index, match] of matches.entries()) {
          const designHex = toHex(match.design);
          const liveHex = toHex(match.live);
          const withinTolerance = match.deltaE2000 <= options.seriesDeltaEThreshold;
          comparisons.push({
            designElementId: measurement.designElementId,
            liveElementId: measurement.liveElementId,
            role: 'series',
            designHex,
            liveHex,
            deltaE2000: match.deltaE2000,
            withinTolerance,
          });
          if (withinTolerance) continue;
          defects.push({
            id: `color:series:${measurement.designElementId}:${index}`,
            type: 'color',
            severity: 'error',
            message:
              `"${measurement.label}" series stop is ${liveHex} but the design uses ${designHex} ` +
              `(ΔE2000 ${match.deltaE2000}, threshold ${options.seriesDeltaEThreshold})`,
            role: 'series',
            expectedHex: designHex,
            actualHex: liveHex,
            deltaE2000: match.deltaE2000,
            threshold: options.seriesDeltaEThreshold,
            designBox: measurement.designBox,
            liveBox: measurement.liveBox,
            designElementId: measurement.designElementId,
            liveElementId: measurement.liveElementId,
          });
        }
        continue;
      }

      const design =
        role === 'background' ? measurement.designBackground : measurement.designForeground;
      const live = role === 'background' ? measurement.liveBackground : measurement.liveForeground;
      if (design === undefined || live === undefined) continue;
      if (role === 'foreground' && !options.checkForeground) continue;

      const threshold =
        role === 'foreground'
          ? inkThresholdForPair(design, live, options)
          : options.deltaEThreshold;
      const deltaE = roundTo(deltaE2000Rgb(design, live, options.weights), 4);
      const withinTolerance = deltaE <= threshold;
      const designHex = toHex(design);
      const liveHex = toHex(live);

      comparisons.push({
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
        role,
        designHex,
        liveHex,
        deltaE2000: deltaE,
        withinTolerance,
      });

      if (withinTolerance) continue;

      defects.push({
        id: `color:${role}:${measurement.designElementId}`,
        type: 'color',
        severity: 'error',
        message:
          `"${measurement.label}" ${role} is ${liveHex} but the design uses ${designHex} ` +
          `(ΔE2000 ${deltaE}, threshold ${threshold})`,
        role,
        expectedHex: designHex,
        actualHex: liveHex,
        deltaE2000: deltaE,
        threshold,
        designBox: measurement.designBox,
        liveBox: measurement.liveBox,
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
      });
    }
  }

  return { comparisons, defects: dedupeColorDefects(defects) };
}

export function colorDefects(result: ColorCheckResult): readonly Defect[] {
  return result.defects;
}

/**
 * Collapses repeated reports of the same shade change (e.g. every bar in a series,
 * every price cell, solid-region clones of one chip).
 *
 * Agents act on "this color drifted", not eight identical hex pairs. Keeps the
 * highest-ΔE sample so the strongest evidence remains.
 */
export function dedupeColorDefects(defects: readonly ColorDefect[]): readonly ColorDefect[] {
  const best = new Map<string, ColorDefect>();
  for (const defect of defects) {
    const key = `${defect.role}|${defect.expectedHex}|${defect.actualHex}`;
    const existing = best.get(key);
    if (existing === undefined || defect.deltaE2000 > existing.deltaE2000) {
      best.set(key, defect);
    }
  }
  return [...best.values()].sort((a, b) => a.id.localeCompare(b.id));
}
