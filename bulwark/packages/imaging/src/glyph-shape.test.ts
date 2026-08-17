import { describe, expect, it } from 'vitest';
import { createBox, createRgb } from '@bulwark/domain';
import { measureGlyphShape } from './glyph-shape.js';
import { buildInkMask, cropInkMask } from './ink-mask.js';
import { toGrayscale } from './grayscale.js';
import { createRaster, fillRect } from './raster.js';
import { drawGlyphBars } from './testing/synthetic.js';

const WHITE = createRgb(255, 255, 255);
const BLUE = createRgb(37, 99, 235);
const NAVY = createRgb(17, 24, 39);

describe('cropInkMask', () => {
  it('slices a mask without re-thresholding it', () => {
    const raster = createRaster(20, 10, WHITE);
    fillRect(raster, createBox(4, 2, 12, 8), NAVY);
    const mask = buildInkMask(toGrayscale(raster));

    const cropped = cropInkMask(mask, createBox(4, 2, 12, 8));
    expect([cropped.width, cropped.height]).toEqual([8, 6]);
    expect(cropped.inkPixelCount).toBe(48);
    expect(cropped.polarity).toBe(mask.polarity);
    expect(cropped.threshold).toBe(mask.threshold);
  });

  it('keeps light-on-dark polarity when narrowed to pure ink', () => {
    const raster = createRaster(40, 20, BLUE);
    fillRect(raster, createBox(10, 6, 30, 14), WHITE);
    const mask = buildInkMask(toGrayscale(raster));

    const cropped = cropInkMask(mask, createBox(10, 6, 30, 14));
    expect(cropped.polarity).toBe('light-on-dark');
    // Every pixel in the region is ink; a fresh threshold would have found none.
    expect(cropped.inkPixelCount).toBe(cropped.width * cropped.height);
  });

  it('clips a region that hangs off the mask', () => {
    const raster = createRaster(10, 10, WHITE);
    fillRect(raster, createBox(0, 0, 4, 4), NAVY);
    const mask = buildInkMask(toGrayscale(raster));
    expect(cropInkMask(mask, createBox(6, 6, 40, 40)).width).toBe(4);
  });

  it('refuses a region with no overlap', () => {
    const mask = buildInkMask(toGrayscale(createRaster(10, 10, WHITE)));
    expect(() => cropInkMask(mask, createBox(20, 20, 30, 30))).toThrow(RangeError);
  });
});

describe('measureGlyphShape', () => {
  it('measures dark text on a light card', () => {
    const raster = createRaster(80, 40, WHITE);
    drawGlyphBars(raster, { x: 8, y: 10, height: 20, strokeWidth: 2, gap: 6, count: 8 });

    const measured = measureGlyphShape(raster);
    expect(measured?.measurement.visualHeightPx).toBe(20);
    expect(measured?.shape.height).toBe(20);
    expect(measured?.mask.polarity).toBe('dark-on-light');
  });

  it('measures light text on a dark button, where a naive re-threshold fails', () => {
    const raster = createRaster(80, 40, BLUE);
    drawGlyphBars(raster, {
      x: 8,
      y: 12,
      height: 16,
      strokeWidth: 2,
      gap: 6,
      count: 8,
      color: WHITE,
    });

    const measured = measureGlyphShape(raster);
    expect(measured?.mask.polarity).toBe('light-on-dark');
    expect(measured?.measurement.visualHeightPx).toBe(16);
  });

  it('measures inside a supplied region, using the full crop for the threshold', () => {
    const raster = createRaster(80, 60, BLUE);
    drawGlyphBars(raster, {
      x: 8,
      y: 8,
      height: 10,
      strokeWidth: 2,
      gap: 6,
      count: 8,
      color: WHITE,
    });
    drawGlyphBars(raster, {
      x: 8,
      y: 40,
      height: 14,
      strokeWidth: 2,
      gap: 6,
      count: 8,
      color: WHITE,
    });

    const secondLine = measureGlyphShape(raster, { region: createBox(0, 36, 80, 60) });
    expect(secondLine?.measurement.visualHeightPx).toBe(14);
  });

  it('returns a shape cropped to the ink, not to the crop', () => {
    const raster = createRaster(120, 60, WHITE);
    drawGlyphBars(raster, { x: 20, y: 20, height: 12, strokeWidth: 2, gap: 4, count: 5 });

    const measured = measureGlyphShape(raster);
    expect(measured?.shape.height).toBe(12);
    // 5 strokes of 2px with 4px kerning spans 26px.
    expect(measured?.shape.width).toBe(26);
  });

  it('returns null for a blank crop', () => {
    expect(measureGlyphShape(createRaster(20, 20, WHITE))).toBeNull();
  });
});
