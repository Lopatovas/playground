import { describe, expect, it } from 'vitest';
import { createRgb, parseColor, relativeLuminance, toHex } from './rgb.js';
import { rgbToLab, xyzToLab, rgbToXyz } from './lab.js';
import { JUST_NOTICEABLE_DELTA_E, deltaE2000, deltaE2000Rgb } from './delta-e.js';
import { assignPaletteRoles, sortClustersByDominance } from './palette.js';

describe('parseColor', () => {
  it('parses the forms browsers and design tools emit', () => {
    expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor('#1a2b3c')).toEqual({ r: 26, g: 43, b: 60 });
    expect(parseColor('rgb(18, 52, 86)')).toEqual({ r: 18, g: 52, b: 86 });
    expect(parseColor('rgba(18, 52, 86, 0.5)')).toEqual({ r: 18, g: 52, b: 86 });
    expect(parseColor('rgb(18 52 86 / 50%)')).toEqual({ r: 18, g: 52, b: 86 });
    expect(parseColor('  #0a0b0c  ')).toEqual({ r: 10, g: 11, b: 12 });
  });

  it('parses percentage channels', () => {
    expect(parseColor('rgb(100%, 0%, 50%)')).toEqual({ r: 255, g: 0, b: 128 });
  });

  it('rejects values it cannot interpret', () => {
    expect(() => parseColor('transparent')).toThrow(SyntaxError);
    expect(() => parseColor('#12345')).toThrow(SyntaxError);
    expect(() => parseColor('rgb(1, 2)')).toThrow(SyntaxError);
  });
});

describe('rgb helpers', () => {
  it('clamps and rounds channels', () => {
    expect(createRgb(-5, 260, 12.6)).toEqual({ r: 0, g: 255, b: 13 });
  });

  it('formats hex with padding', () => {
    expect(toHex(createRgb(0, 10, 255))).toBe('#000aff');
  });

  it('orders luminance from black to white', () => {
    expect(relativeLuminance(createRgb(0, 0, 0))).toBe(0);
    expect(relativeLuminance(createRgb(255, 255, 255))).toBeCloseTo(1, 10);
    expect(relativeLuminance(createRgb(128, 128, 128))).toBeGreaterThan(0.2);
    expect(relativeLuminance(createRgb(128, 128, 128))).toBeLessThan(0.3);
  });
});

describe('sRGB to CIE Lab', () => {
  it('maps the achromatic axis to known lightness values', () => {
    expect(rgbToLab(createRgb(255, 255, 255)).l).toBeCloseTo(100, 3);
    expect(rgbToLab(createRgb(255, 255, 255)).a).toBeCloseTo(0, 3);
    expect(rgbToLab(createRgb(255, 255, 255)).b).toBeCloseTo(0, 3);
    expect(rgbToLab(createRgb(0, 0, 0))).toEqual({ l: 0, a: 0, b: 0 });
    expect(rgbToLab(createRgb(128, 128, 128)).l).toBeCloseTo(53.585, 2);
  });

  it('matches published Lab values for the sRGB primaries', () => {
    const red = rgbToLab(createRgb(255, 0, 0));
    expect(red.l).toBeCloseTo(53.2408, 3);
    expect(red.a).toBeCloseTo(80.0925, 3);
    expect(red.b).toBeCloseTo(67.2032, 3);

    const green = rgbToLab(createRgb(0, 255, 0));
    expect(green.l).toBeCloseTo(87.7347, 3);
    expect(green.a).toBeCloseTo(-86.1827, 3);
    expect(green.b).toBeCloseTo(83.1793, 3);

    const blue = rgbToLab(createRgb(0, 0, 255));
    expect(blue.l).toBeCloseTo(32.297, 3);
    expect(blue.a).toBeCloseTo(79.1875, 3);
    expect(blue.b).toBeCloseTo(-107.8602, 3);
  });

  it('maps the white point to L=100 through XYZ', () => {
    const xyz = rgbToXyz(createRgb(255, 255, 255));
    // The published matrix coefficients are rounded, so the white point lands a
    // hundred-thousandth above 100 rather than exactly on it.
    expect(xyz.y).toBeCloseTo(100, 4);
    expect(xyzToLab(xyz).l).toBeCloseTo(100, 4);
  });
});

/**
 * Reference pairs from the CIEDE2000 test data published with
 * Sharma, Wu & Dalal (2005). An implementation that passes these has the
 * hue-rotation and chroma-compensation terms right, including the discontinuities
 * around the 0/360 degree boundary that naive implementations get wrong.
 */
const SHARMA_TEST_PAIRS: readonly [[number, number, number], [number, number, number], number][] = [
  [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
  [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
  [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412],
  [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
  [[50, -1.1848, -84.8006], [50, 0, -82.7485], 1.0],
  [[50, -0.9009, -85.5211], [50, 0, -82.7485], 1.0],
  [[50, 0, 0], [50, -1, 2], 2.3669],
  [[50, -1, 2], [50, 0, 0], 2.3669],
  [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
  [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
  [[50, 2.5, 0], [73, 25, -18], 27.1492],
  [[50, 2.5, 0], [61, -5, 29], 22.8977],
  [[50, 2.5, 0], [56, -27, -3], 31.903],
  [[50, 2.5, 0], [58, 24, 15], 19.4535],
  [[50, 2.5, 0], [50, 3.1736, 0.5854], 1.0],
  [[50, 2.5, 0], [50, 3.2972, 0], 1.0],
  [[50, 2.5, 0], [50, 1.8634, 0.5757], 1.0],
  [[50, 2.5, 0], [50, 3.2592, 0.335], 1.0],
  [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263],
  [[61.2901, 3.7196, -5.3901], [61.4292, 2.248, -4.962], 1.8731],
  [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645],
  [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
  [[36.4612, 47.858, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146],
  [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
  [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381],
  [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
  [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
];

describe('deltaE2000', () => {
  it.each(SHARMA_TEST_PAIRS)(
    'matches the reference implementation for %j vs %j',
    (first, second, expected) => {
      const reference = { l: first[0], a: first[1], b: first[2] };
      const sample = { l: second[0], a: second[1], b: second[2] };
      expect(deltaE2000(reference, sample)).toBeCloseTo(expected, 4);
    },
  );

  it('is zero for identical colors', () => {
    expect(deltaE2000({ l: 40, a: 12, b: -30 }, { l: 40, a: 12, b: -30 })).toBe(0);
  });

  it('is symmetric', () => {
    const a = { l: 55, a: -12, b: 34 };
    const b = { l: 51, a: -9, b: 30 };
    expect(deltaE2000(a, b)).toBeCloseTo(deltaE2000(b, a), 10);
  });

  it('treats a one-step channel shift as imperceptible but a design change as visible', () => {
    const gammaNoise = deltaE2000Rgb(createRgb(30, 41, 59), createRgb(31, 41, 59));
    expect(gammaNoise).toBeLessThan(JUST_NOTICEABLE_DELTA_E);

    const wrongShade = deltaE2000Rgb(createRgb(30, 41, 59), createRgb(51, 65, 85));
    expect(wrongShade).toBeGreaterThan(JUST_NOTICEABLE_DELTA_E);
  });

  it('honours custom weighting factors', () => {
    const reference = { l: 50, a: 2.5, b: 0 };
    const sample = { l: 55, a: 2.5, b: 0 };
    const unweighted = deltaE2000(reference, sample);
    const lightnessTolerant = deltaE2000(reference, sample, { lightness: 2, chroma: 1, hue: 1 });
    expect(lightnessTolerant).toBeCloseTo(unweighted / 2, 6);
  });
});

describe('assignPaletteRoles', () => {
  const white = { color: createRgb(255, 255, 255), pixelCount: 8000, share: 0.8 };
  const ink = { color: createRgb(17, 24, 39), pixelCount: 500, share: 0.05 };
  const blurLight = { color: createRgb(170, 175, 185), pixelCount: 900, share: 0.09 };
  const blurDark = { color: createRgb(90, 96, 110), pixelCount: 600, share: 0.06 };

  it('reads the dominant pool as the background', () => {
    const roles = assignPaletteRoles([blurDark, ink, white, blurLight]);
    expect(toHex(roles.background.color)).toBe('#ffffff');
  });

  it('picks the perceptually furthest pool as the foreground, not the smallest', () => {
    const roles = assignPaletteRoles([blurDark, ink, white, blurLight]);
    expect(roles.foreground).not.toBeNull();
    expect(toHex((roles.foreground as { color: ReturnType<typeof createRgb> }).color)).toBe(
      '#111827',
    );
    expect(roles.ignored.map((cluster) => toHex(cluster.color))).toEqual(['#aaafb9', '#5a606e']);
  });

  it('ignores pools that are too small to be real ink', () => {
    const speck = { color: createRgb(0, 0, 0), pixelCount: 3, share: 0.0003 };
    const roles = assignPaletteRoles([white, speck], {
      minForegroundShare: 0.01,
      minForegroundDeltaE: 5,
    });
    expect(roles.foreground).toBeNull();
  });

  it('reports no foreground for a flat fill', () => {
    const roles = assignPaletteRoles([
      { color: createRgb(59, 130, 246), pixelCount: 9000, share: 0.9 },
      { color: createRgb(59, 131, 246), pixelCount: 1000, share: 0.1 },
    ]);
    expect(roles.foreground).toBeNull();
  });

  it('breaks ties by hex so equal-sized pools never reorder between runs', () => {
    const sorted = sortClustersByDominance([
      { color: createRgb(255, 0, 0), pixelCount: 100, share: 0.5 },
      { color: createRgb(0, 0, 255), pixelCount: 100, share: 0.5 },
    ]);
    expect(sorted.map((cluster) => toHex(cluster.color))).toEqual(['#0000ff', '#ff0000']);
  });

  it('rejects an empty cluster set', () => {
    expect(() => assignPaletteRoles([])).toThrow(RangeError);
  });
});
