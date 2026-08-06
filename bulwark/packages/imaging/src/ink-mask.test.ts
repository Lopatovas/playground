import { describe, expect, it } from 'vitest';
import { createBox, createRgb } from '@bulwark/domain';
import { buildInkMask, otsuThreshold, strokeDensity } from './ink-mask.js';
import { toGrayscale, histogram } from './grayscale.js';
import { createRaster, fillRect } from './raster.js';
import { drawGlyphBars, gradientRaster, solidRaster } from './testing/synthetic.js';

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
