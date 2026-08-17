import type { Rgb } from './rgb.js';
import { roundTo } from '../numeric.js';

export interface Xyz {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/** CIE L*a*b* under a D65 illuminant, which is what sRGB content is authored for. */
export interface Lab {
  readonly l: number;
  readonly a: number;
  readonly b: number;
}

/** D65 reference white, scaled to Y = 100. */
export const D65_WHITE_POINT: Xyz = { x: 95.047, y: 100, z: 108.883 };

/** Undoes the sRGB transfer function for one 8-bit channel. */
export function srgbChannelToLinear(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function rgbToXyz(color: Rgb): Xyz {
  const r = srgbChannelToLinear(color.r) * 100;
  const g = srgbChannelToLinear(color.g) * 100;
  const b = srgbChannelToLinear(color.b) * 100;

  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  };
}

export function xyzToLab(xyz: Xyz, whitePoint: Xyz = D65_WHITE_POINT): Lab {
  const fx = pivot(xyz.x / whitePoint.x);
  const fy = pivot(xyz.y / whitePoint.y);
  const fz = pivot(xyz.z / whitePoint.z);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function rgbToLab(color: Rgb): Lab {
  return xyzToLab(rgbToXyz(color));
}

export function roundLab(lab: Lab, decimals = 4): Lab {
  return {
    l: roundTo(lab.l, decimals),
    a: roundTo(lab.a, decimals),
    b: roundTo(lab.b, decimals),
  };
}

const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

function pivot(ratio: number): number {
  return ratio > EPSILON ? Math.cbrt(ratio) : (KAPPA * ratio + 16) / 116;
}
