import { describe, expect, it } from 'vitest';
import { createBox, createRgb, deriveCssFontSize, MARK_PRO_PROFILE } from '@bulwark/domain';
import {
  DEFAULT_CHARACTER_BAND_OPTIONS,
  DEFAULT_LINE_BAND_OPTIONS,
  DEFAULT_TEXT_INK_OPTIONS,
  findBands,
  inkProfile,
  measureTextInk,
  tightInkBox,
} from './projection.js';
import { buildInkMask } from './ink-mask.js';
import { toGrayscale } from './grayscale.js';
import { createRaster, fillRect } from './raster.js';
import { drawGlyphBars } from './testing/synthetic.js';

const WHITE = createRgb(255, 255, 255);
const NAVY = createRgb(17, 24, 39);

function maskOf(draw: (raster: ReturnType<typeof createRaster>) => void, width = 60, height = 30) {
  const raster = createRaster(width, height, WHITE);
  draw(raster);
  return buildInkMask(toGrayscale(raster));
}

describe('inkProfile', () => {
  it('counts ink per row and per column', () => {
    const mask = maskOf((raster) => fillRect(raster, createBox(2, 3, 6, 5), NAVY), 10, 8);

    expect([...inkProfile(mask, 'row')]).toEqual([0, 0, 0, 4, 4, 0, 0, 0]);
    expect([...inkProfile(mask, 'column')]).toEqual([0, 0, 2, 2, 2, 2, 0, 0, 0, 0]);
  });
});

describe('findBands', () => {
  it('finds contiguous runs above the threshold', () => {
    const profile = new Uint32Array([0, 0, 5, 5, 0, 0, 4, 4, 4, 0]);
    expect(findBands(profile, DEFAULT_LINE_BAND_OPTIONS)).toEqual([
      { start: 2, end: 4 },
      { start: 6, end: 9 },
    ]);
  });

  it('merges runs separated by a gap smaller than the merge distance', () => {
    const profile = new Uint32Array([5, 5, 0, 5, 5]);
    expect(findBands(profile, { ...DEFAULT_LINE_BAND_OPTIONS, maxGapToMerge: 1 })).toEqual([
      { start: 0, end: 5 },
    ]);
  });

  it('keeps kerning gaps separate when merging is disabled', () => {
    const profile = new Uint32Array([5, 5, 0, 5, 5]);
    expect(findBands(profile, DEFAULT_CHARACTER_BAND_OPTIONS)).toEqual([
      { start: 0, end: 2 },
      { start: 3, end: 5 },
    ]);
  });

  it('discards anti-aliasing haze below the peak ratio', () => {
    const profile = new Uint32Array([1, 20, 20, 1]);
    expect(findBands(profile, { minPeakRatio: 0.5, minBandSize: 1, maxGapToMerge: 0 })).toEqual([
      { start: 1, end: 3 },
    ]);
  });

  it('drops bands thinner than the minimum', () => {
    const profile = new Uint32Array([5, 0, 5, 5, 5]);
    expect(findBands(profile, { minPeakRatio: 0.1, minBandSize: 2, maxGapToMerge: 0 })).toEqual([
      { start: 2, end: 5 },
    ]);
  });

  it('returns nothing for a blank profile', () => {
    expect(findBands(new Uint32Array([0, 0, 0]), DEFAULT_LINE_BAND_OPTIONS)).toEqual([]);
  });

  it('rejects an out-of-range peak ratio', () => {
    expect(() => findBands(new Uint32Array([1]), { ...DEFAULT_LINE_BAND_OPTIONS, minPeakRatio: 2 })).toThrow(
      RangeError,
    );
  });
});

describe('tightInkBox', () => {
  it('wraps the ink exactly, excluding the block padding around it', () => {
    const mask = maskOf((raster) => fillRect(raster, createBox(12, 8, 30, 20), NAVY));
    expect(tightInkBox(mask)).toEqual({ xMin: 12, yMin: 8, xMax: 30, yMax: 20 });
  });

  it('returns null for a blank crop', () => {
    const mask = maskOf(() => undefined);
    expect(tightInkBox(mask)).toBeNull();
  });
});

describe('measureTextInk', () => {
  it('measures glyph height while ignoring surrounding line-height padding', () => {
    // 20px-tall bars inside a 40px-tall box: the box height must not be the answer.
    const mask = maskOf(
      (raster) => drawGlyphBars(raster, { x: 6, y: 10, height: 20, strokeWidth: 2, gap: 3, count: 8 }),
      80,
      40,
    );

    const measurement = measureTextInk(mask);
    expect(measurement?.visualHeightPx).toBe(20);
    // 8 strokes of 2px with 3px kerning: 6 + 8*2 + 7*3 = 43.
    expect(measurement?.tightBox).toEqual({ xMin: 6, yMin: 10, xMax: 43, yMax: 30 });
    expect(measurement?.lines).toHaveLength(1);
    expect(measurement?.lines[0]?.characterCount).toBe(8);
  });

  it('feeds the blueprint formula: 19.68px of ink implies 24px Mark Pro type', () => {
    const mask = maskOf(
      (raster) => drawGlyphBars(raster, { x: 4, y: 4, height: 20, strokeWidth: 2, gap: 2, count: 6 }),
      60,
      30,
    );
    const measurement = measureTextInk(mask);
    expect(measurement).not.toBeNull();
    // 20px of ink / 0.82 rounds to 24px CSS.
    expect(deriveCssFontSize(measurement!.visualHeightPx, MARK_PRO_PROFILE)).toBe(24);
  });

  it('ignores a single descender when taking the median character extent', () => {
    const mask = maskOf(
      (raster) =>
        drawGlyphBars(raster, {
          x: 6,
          y: 10,
          height: 20,
          strokeWidth: 2,
          gap: 3,
          count: 8,
          descenderHeight: 6,
          descenderStrokes: [3],
        }),
      80,
      44,
    );

    const median = measureTextInk(mask);
    expect(median?.visualHeightPx).toBe(20);

    const lineExtent = measureTextInk(mask, {
      ...DEFAULT_TEXT_INK_OPTIONS,
      mode: 'line-extent',
    });
    expect(lineExtent?.visualHeightPx).toBe(26);
  });

  it('splits stacked lines and reports the median line height', () => {
    const mask = maskOf((raster) => {
      drawGlyphBars(raster, { x: 6, y: 4, height: 10, strokeWidth: 2, gap: 3, count: 6 });
      drawGlyphBars(raster, { x: 6, y: 24, height: 10, strokeWidth: 2, gap: 3, count: 6 });
    }, 80, 40);

    const measurement = measureTextInk(mask);
    expect(measurement?.lines).toHaveLength(2);
    expect(measurement?.visualHeightPx).toBe(10);
    expect(measurement?.lines.map((line) => line.box.yMin)).toEqual([4, 24]);
  });

  it('reports ink coverage inside the tight box, not the padded crop', () => {
    const mask = maskOf((raster) => fillRect(raster, createBox(10, 10, 20, 20), NAVY), 60, 40);
    const measurement = measureTextInk(mask);
    expect(measurement?.strokeDensity).toBe(1);
  });

  it('returns null for a crop with no ink', () => {
    expect(measureTextInk(maskOf(() => undefined))).toBeNull();
  });

  it('is unaffected by where the text sits inside the crop', () => {
    const left = maskOf(
      (raster) => drawGlyphBars(raster, { x: 2, y: 6, height: 12, strokeWidth: 2, gap: 2, count: 5 }),
      60,
      30,
    );
    const right = maskOf(
      (raster) => drawGlyphBars(raster, { x: 30, y: 6, height: 12, strokeWidth: 2, gap: 2, count: 5 }),
      60,
      30,
    );

    expect(measureTextInk(left)?.visualHeightPx).toBe(measureTextInk(right)?.visualHeightPx);
  });
});
