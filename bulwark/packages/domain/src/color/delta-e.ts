import type { Lab } from './lab.js';
import { rgbToLab } from './lab.js';
import type { Rgb } from './rgb.js';
import { roundTo } from '../numeric.js';

/**
 * The Delta E score at which an average observer notices two flat colors differ.
 * Below it, browser gamma handling and display profiles produce more variation than
 * a genuine design mistake would.
 */
export const JUST_NOTICEABLE_DELTA_E = 2;

export interface DeltaE2000Weights {
  /** Lightness weighting factor (kL). */
  readonly lightness: number;
  /** Chroma weighting factor (kC). */
  readonly chroma: number;
  /** Hue weighting factor (kH). */
  readonly hue: number;
}

export const DEFAULT_DELTA_E_WEIGHTS: DeltaE2000Weights = {
  lightness: 1,
  chroma: 1,
  hue: 1,
};

/**
 * CIEDE2000 color difference (Sharma, Wu & Dalal 2005 formulation).
 *
 * Hue-dependent weighting is the whole point: a 3-unit shift in a saturated blue is
 * invisible while the same shift in a near-neutral grey is obvious, and a plain
 * hex-to-hex or Euclidean Lab comparison cannot tell those apart.
 */
export function deltaE2000(
  reference: Lab,
  sample: Lab,
  weights: DeltaE2000Weights = DEFAULT_DELTA_E_WEIGHTS,
): number {
  const { lightness: kL, chroma: kC, hue: kH } = weights;

  const lBarPrime = (reference.l + sample.l) / 2;
  const c1 = Math.hypot(reference.a, reference.b);
  const c2 = Math.hypot(sample.a, sample.b);
  const cBar = (c1 + c2) / 2;

  const cBar7 = cBar ** 7;
  const g = 0.5 * (1 - Math.sqrt(cBar7 / (cBar7 + 25 ** 7)));

  const a1Prime = reference.a * (1 + g);
  const a2Prime = sample.a * (1 + g);

  const c1Prime = Math.hypot(a1Prime, reference.b);
  const c2Prime = Math.hypot(a2Prime, sample.b);
  const cBarPrime = (c1Prime + c2Prime) / 2;

  const h1Prime = hueAngle(a1Prime, reference.b);
  const h2Prime = hueAngle(a2Prime, sample.b);

  const deltaLPrime = sample.l - reference.l;
  const deltaCPrime = c2Prime - c1Prime;

  let deltahPrime: number;
  if (c1Prime * c2Prime === 0) {
    deltahPrime = 0;
  } else {
    const diff = h2Prime - h1Prime;
    if (Math.abs(diff) <= 180) {
      deltahPrime = diff;
    } else if (diff > 180) {
      deltahPrime = diff - 360;
    } else {
      deltahPrime = diff + 360;
    }
  }
  const deltaHPrime =
    2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(degreesToRadians(deltahPrime) / 2);

  let hBarPrime: number;
  if (c1Prime * c2Prime === 0) {
    hBarPrime = h1Prime + h2Prime;
  } else {
    const diff = Math.abs(h1Prime - h2Prime);
    const total = h1Prime + h2Prime;
    if (diff <= 180) {
      hBarPrime = total / 2;
    } else if (total < 360) {
      hBarPrime = (total + 360) / 2;
    } else {
      hBarPrime = (total - 360) / 2;
    }
  }

  const t =
    1 -
    0.17 * Math.cos(degreesToRadians(hBarPrime - 30)) +
    0.24 * Math.cos(degreesToRadians(2 * hBarPrime)) +
    0.32 * Math.cos(degreesToRadians(3 * hBarPrime + 6)) -
    0.2 * Math.cos(degreesToRadians(4 * hBarPrime - 63));

  const lBarPrimeMinus50Squared = (lBarPrime - 50) ** 2;
  const sL = 1 + (0.015 * lBarPrimeMinus50Squared) / Math.sqrt(20 + lBarPrimeMinus50Squared);
  const sC = 1 + 0.045 * cBarPrime;
  const sH = 1 + 0.015 * cBarPrime * t;

  const cBarPrime7 = cBarPrime ** 7;
  const rC = 2 * Math.sqrt(cBarPrime7 / (cBarPrime7 + 25 ** 7));
  const deltaTheta = 30 * Math.exp(-(((hBarPrime - 275) / 25) ** 2));
  const rT = -rC * Math.sin(degreesToRadians(2 * deltaTheta));

  const termL = deltaLPrime / (kL * sL);
  const termC = deltaCPrime / (kC * sC);
  const termH = deltaHPrime / (kH * sH);

  return Math.sqrt(termL ** 2 + termC ** 2 + termH ** 2 + rT * termC * termH);
}

/** Convenience wrapper: converts both sRGB colors to Lab, then compares. */
export function deltaE2000Rgb(
  reference: Rgb,
  sample: Rgb,
  weights: DeltaE2000Weights = DEFAULT_DELTA_E_WEIGHTS,
): number {
  return roundTo(deltaE2000(rgbToLab(reference), rgbToLab(sample), weights), 4);
}

function hueAngle(aPrime: number, b: number): number {
  if (aPrime === 0 && b === 0) return 0;
  const degrees = radiansToDegrees(Math.atan2(b, aPrime));
  return degrees >= 0 ? degrees : degrees + 360;
}

function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}
