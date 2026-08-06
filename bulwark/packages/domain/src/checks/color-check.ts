import type { BoundingBox } from '../geometry/box.js';
import type { ColorDefect, ColorRole, Defect } from '../defects/defect.js';
import type { Rgb } from '../color/rgb.js';
import { toHex } from '../color/rgb.js';
import type { DeltaE2000Weights } from '../color/delta-e.js';
import { DEFAULT_DELTA_E_WEIGHTS, JUST_NOTICEABLE_DELTA_E, deltaE2000Rgb } from '../color/delta-e.js';
import { roundTo } from '../numeric.js';

/**
 * Colors extracted for one matched element: clustered from the design crop, read
 * from `getComputedStyle` on the live side.
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
}

export interface ColorCheckOptions {
  /** Delta E above which a shade difference is reported. */
  readonly deltaEThreshold: number;
  readonly weights: DeltaE2000Weights;
  readonly checkForeground: boolean;
}

export const DEFAULT_COLOR_CHECK_OPTIONS: ColorCheckOptions = {
  deltaEThreshold: JUST_NOTICEABLE_DELTA_E,
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

/**
 * Compares design colors against live colors in a perceptual space.
 *
 * Hex equality is not usable here: browsers apply their own gamma handling and
 * display profiles, so identical intent routinely produces a one- or two-step
 * channel difference. Delta E 2000 with a threshold at the just-noticeable
 * difference reports only the shifts a human would actually see.
 */
export function checkColors(
  measurements: readonly ColorMeasurement[],
  options: ColorCheckOptions = DEFAULT_COLOR_CHECK_OPTIONS,
): ColorCheckResult {
  if (!(options.deltaEThreshold >= 0)) {
    throw new RangeError('checkColors() requires a non-negative deltaEThreshold');
  }

  const comparisons: ColorComparison[] = [];
  const defects: ColorDefect[] = [];

  for (const measurement of measurements) {
    const roles: { role: ColorRole; design: Rgb | undefined; live: Rgb | undefined }[] = [
      { role: 'background', design: measurement.designBackground, live: measurement.liveBackground },
    ];
    if (options.checkForeground) {
      roles.push({
        role: 'foreground',
        design: measurement.designForeground,
        live: measurement.liveForeground,
      });
    }

    for (const { role, design, live } of roles) {
      if (design === undefined || live === undefined) continue;

      const deltaE = roundTo(deltaE2000Rgb(design, live, options.weights), 4);
      const withinTolerance = deltaE <= options.deltaEThreshold;
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
          `(ΔE2000 ${deltaE}, threshold ${options.deltaEThreshold})`,
        role,
        expectedHex: designHex,
        actualHex: liveHex,
        deltaE2000: deltaE,
        threshold: options.deltaEThreshold,
        designBox: measurement.designBox,
        liveBox: measurement.liveBox,
        designElementId: measurement.designElementId,
        liveElementId: measurement.liveElementId,
      });
    }
  }

  return { comparisons, defects };
}

export function colorDefects(result: ColorCheckResult): readonly Defect[] {
  return result.defects;
}
