import type { Rgb } from '@bulwark/domain';
import { createBox, createRgb } from '@bulwark/domain';
import type { Raster } from '../raster.js';
import { createRaster, fillRect, setPixel } from '../raster.js';

/**
 * Builders for synthetic rasters.
 *
 * Image analysis tests need inputs whose exact ink geometry is known in advance;
 * these produce that without depending on installed fonts or a browser, which also
 * keeps the test suite runnable in a bare CI container.
 */

export interface GlyphBarOptions {
  /** Left edge of the first stroke. */
  readonly x: number;
  /** Top edge of every stroke. */
  readonly y: number;
  readonly height: number;
  readonly strokeWidth: number;
  readonly gap: number;
  readonly count: number;
  readonly color?: Rgb;
  /** Extra rows to extend below the baseline, simulating a descender. */
  readonly descenderHeight?: number;
  /** Indices of strokes that get the descender. */
  readonly descenderStrokes?: readonly number[];
}

/**
 * Draws a row of vertical bars: a stand-in for a line of text whose per-character
 * ink extents are known exactly.
 */
export function drawGlyphBars(raster: Raster, options: GlyphBarOptions): void {
  const color = options.color ?? createRgb(17, 24, 39);
  const descenderStrokes = new Set(options.descenderStrokes ?? []);

  for (let index = 0; index < options.count; index += 1) {
    const x = options.x + index * (options.strokeWidth + options.gap);
    const extraHeight = descenderStrokes.has(index) ? (options.descenderHeight ?? 0) : 0;
    fillRect(
      raster,
      createBox(x, options.y, x + options.strokeWidth, options.y + options.height + extraHeight),
      color,
    );
  }
}

export function solidRaster(width: number, height: number, color: Rgb): Raster {
  return createRaster(width, height, color);
}

/** Horizontal gradient, useful for checking that clustering handles smooth ramps. */
export function gradientRaster(width: number, height: number): Raster {
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = Math.round((x / Math.max(1, width - 1)) * 255);
      setPixel(raster, x, y, createRgb(value, value, value));
    }
  }
  return raster;
}

export function checkerboardRaster(
  width: number,
  height: number,
  cellSize: number,
  a: Rgb,
  b: Rgb,
): Raster {
  const raster = createRaster(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const isA = (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0;
      setPixel(raster, x, y, isA ? a : b);
    }
  }
  return raster;
}

/**
 * A button-like crop: a solid fill with a block of ink and a ring of intermediate
 * anti-aliasing pixels around it, which is the shape palette extraction has to cope
 * with.
 */
export function buttonRaster(options: {
  readonly width: number;
  readonly height: number;
  readonly background: Rgb;
  readonly foreground: Rgb;
  readonly inkBox: { xMin: number; yMin: number; xMax: number; yMax: number };
}): Raster {
  const raster = createRaster(options.width, options.height, options.background);
  const { inkBox } = options;

  const halo = createRgb(
    Math.round((options.background.r + options.foreground.r) / 2),
    Math.round((options.background.g + options.foreground.g) / 2),
    Math.round((options.background.b + options.foreground.b) / 2),
  );
  fillRect(
    raster,
    createBox(inkBox.xMin - 1, inkBox.yMin - 1, inkBox.xMax + 1, inkBox.yMax + 1),
    halo,
  );
  fillRect(raster, createBox(inkBox.xMin, inkBox.yMin, inkBox.xMax, inkBox.yMax), options.foreground);

  return raster;
}
