import { describe, expect, it } from 'vitest';
import { createBox, createRgb } from '@bulwark/domain';
import { buildInkMask, extractInkColor, meanMaskedRgb, otsuThreshold, strokeDensity } from './ink-mask.js';
import { toGrayscale, histogram } from './grayscale.js';
import { createRaster, fillRect } from './raster.js';
import { drawGlyphBars, gradientRaster, solidRaster } from './testing/synthetic.js';
import { toHex } from '@bulwark/domain';

const WHITE = createRgb(255, 255, 255);
const BLACK = createRgb(0, 0, 0);
const NAVY = createRgb(17, 24, 39);

describe('toGrayscale', () => {
  it('weights channels perceptually', () => {
    const red = toGrayscale(solidRaster(2, 2, createRgb(255, 0, 0)));
    const green = toGrayscale(solidRaster(2, 2, createRgb(0, 255, 0)));
    const blue = toGrayscale(solidRaster(2, 2, createRgb(0, 0, 255)));

    expect(red.data[0]).toBe(76);
    expect(green.data[0]).toBe(150);
    expect(blue.data[0]).toBe(29);
  });

  it('keeps the achromatic axis intact', () => {
    expect(toGrayscale(solidRaster(1, 1, WHITE)).data[0]).toBe(255);
    expect(toGrayscale(solidRaster(1, 1, BLACK)).data[0]).toBe(0);
  });
});

describe('histogram', () => {
  it('counts every pixel exactly once', () => {
    const bins = histogram(toGrayscale(gradientRaster(64, 4)));
    expect(bins.reduce((total, count) => total + count, 0)).toBe(256);
  });
});

describe('otsuThreshold', () => {
  it('splits a bimodal image between its two modes', () => {
    const raster = createRaster(20, 10, WHITE);
    fillRect(raster, createBox(0, 0, 6, 10), BLACK);
    const threshold = otsuThreshold(toGrayscale(raster));

    expect(threshold).toBe(127);
  });

  it('places the threshold between two mid-tone modes', () => {
    const raster = createRaster(20, 10, createRgb(200, 200, 200));
    fillRect(raster, createBox(0, 0, 10, 10), createRgb(100, 100, 100));
    const threshold = otsuThreshold(toGrayscale(raster));

    expect(threshold).toBeGreaterThanOrEqual(100);
    expect(threshold).toBeLessThan(200);
  });

  it('needs no tuning to handle dark text on a tinted card', () => {
    const raster = createRaster(20, 10, createRgb(226, 232, 240));
    fillRect(raster, createBox(2, 2, 8, 8), NAVY);
    const gray = toGrayscale(raster);
    const threshold = otsuThreshold(gray);

    expect(threshold).toBeGreaterThan(20);
    expect(threshold).toBeLessThan(226);
  });

  it('is stable for a flat image', () => {
    expect(otsuThreshold(toGrayscale(solidRaster(4, 4, WHITE)))).toBe(0);
  });
});

describe('buildInkMask', () => {
  it('marks dark glyphs as ink on a light background', () => {
    const raster = createRaster(20, 10, WHITE);
    fillRect(raster, createBox(4, 2, 8, 8), NAVY);
    const mask = buildInkMask(toGrayscale(raster));

    expect(mask.polarity).toBe('dark-on-light');
    expect(mask.inkPixelCount).toBe(24);
    expect(mask.data[2 * 20 + 4]).toBe(1);
    expect(mask.data[0]).toBe(0);
  });

  it('inverts automatically for light text on a dark button', () => {
    const raster = createRaster(20, 10, NAVY);
    fillRect(raster, createBox(4, 2, 8, 8), WHITE);
    const mask = buildInkMask(toGrayscale(raster));

    expect(mask.polarity).toBe('light-on-dark');
    expect(mask.inkPixelCount).toBe(24);
  });

  it('honours an explicit polarity when the caller knows the theme', () => {
    const raster = createRaster(20, 10, NAVY);
    fillRect(raster, createBox(4, 2, 8, 8), WHITE);
    const mask = buildInkMask(toGrayscale(raster), 'dark-on-light');

    expect(mask.polarity).toBe('dark-on-light');
    expect(mask.inkPixelCount).toBe(200 - 24);
  });
});

describe('strokeDensity', () => {
  it('rises with stroke thickness, which is what the weight bands read', () => {
    const regular = createRaster(40, 12, WHITE);
    drawGlyphBars(regular, { x: 2, y: 2, height: 8, strokeWidth: 1, gap: 3, count: 9 });

    const bold = createRaster(40, 12, WHITE);
    drawGlyphBars(bold, { x: 2, y: 2, height: 8, strokeWidth: 3, gap: 1, count: 9 });

    const regularDensity = strokeDensity(buildInkMask(toGrayscale(regular)));
    const boldDensity = strokeDensity(buildInkMask(toGrayscale(bold)));

    expect(regularDensity).toBeLessThan(boldDensity);
    expect(boldDensity / regularDensity).toBeGreaterThan(2);
  });

  it('measures a known coverage exactly', () => {
    const raster = createRaster(10, 10, WHITE);
    fillRect(raster, createBox(0, 0, 5, 10), BLACK);
    expect(strokeDensity(buildInkMask(toGrayscale(raster)))).toBe(0.5);
  });

  it('can restrict the measurement to a region', () => {
    const raster = createRaster(10, 10, WHITE);
    fillRect(raster, createBox(0, 0, 5, 10), BLACK);
    const mask = buildInkMask(toGrayscale(raster));

    expect(strokeDensity(mask, { xMin: 0, yMin: 0, xMax: 5, yMax: 10 })).toBe(1);
    expect(strokeDensity(mask, { xMin: 5, yMin: 0, xMax: 10, yMax: 10 })).toBe(0);
  });

  it('rejects an empty region', () => {
    const mask = buildInkMask(toGrayscale(solidRaster(4, 4, WHITE)));
    expect(() => strokeDensity(mask, { xMin: 2, yMin: 2, xMax: 2, yMax: 4 })).toThrow(RangeError);
  });
});

describe('meanMaskedRgb', () => {
  it('averages only ink pixels', () => {
    const raster = createRaster(10, 10, WHITE);
    fillRect(raster, createBox(0, 0, 5, 10), NAVY);
    const mask = buildInkMask(toGrayscale(raster));
    expect(toHex(meanMaskedRgb(raster, mask)!)).toBe('#111827');
  });

  it('returns undefined when the mask has no ink', () => {
    const raster = solidRaster(4, 4, WHITE);
    const mask = buildInkMask(toGrayscale(raster));
    expect(meanMaskedRgb(raster, mask)).toBeUndefined();
  });
});

describe('extractInkColor', () => {
  it('recovers dark navy ink on white paper', () => {
    const raster = createRaster(40, 16, WHITE);
    fillRect(raster, createBox(8, 4, 24, 12), NAVY);
    const ink = extractInkColor(raster);
    expect(ink).toBeDefined();
    expect(ink!.polarity).toBe('dark-on-light');
    expect(toHex(ink!.color)).toBe('#111827');
  });

  it('recovers accent ink that is close in luminance to the paper', () => {
    // Soft yellow headline on near-white — grayscale Otsu often blends these.
    const paper = createRgb(255, 255, 255);
    const accent = createRgb(255, 229, 102); // #ffe566
    const raster = createRaster(48, 18, paper);
    fillRect(raster, createBox(6, 4, 36, 14), accent);
    const ink = extractInkColor(raster, { minDeltaE: 8 });
    expect(ink).toBeDefined();
    expect(toHex(ink!.color)).toBe('#ffe566');
  });

  it('tightens padded crops before sampling ink', () => {
    // Large paper padding so the tight re-crop is clearly smaller than the detector box.
    const raster = createRaster(120, 60, WHITE);
    fillRect(raster, createBox(40, 20, 80, 40), NAVY);
    const loose = extractInkColor(raster, { tighten: false });
    const tight = extractInkColor(raster, { tighten: true });
    expect(loose).toBeDefined();
    expect(tight).toBeDefined();
    expect(toHex(loose!.color)).toBe('#111827');
    expect(toHex(tight!.color)).toBe('#111827');
    expect(tight!.inkShare).toBeGreaterThan(loose!.inkShare);
  });

  it('recovers light ink on a dark fill', () => {
    const raster = createRaster(40, 16, NAVY);
    fillRect(raster, createBox(8, 4, 24, 12), WHITE);
    const ink = extractInkColor(raster);
    expect(ink).toBeDefined();
    expect(ink!.polarity).toBe('light-on-dark');
    expect(toHex(ink!.color)).toBe('#ffffff');
  });

  it('rejects a flat fill with no glyphs', () => {
    expect(extractInkColor(solidRaster(20, 20, WHITE))).toBeUndefined();
  });
});
