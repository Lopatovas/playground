import { describe, expect, it } from 'vitest';
import { createBox, createRgb } from '@bulwark/domain';
import { DEFAULT_SSIM_OPTIONS, gaussianKernel, ssim } from './ssim.js';
import { alignForShapeComparison, inkMaskToGray, padToWidth, resizeBilinear } from './resize.js';
import { toGrayscale, createGrayImage } from './grayscale.js';
import { buildInkMask } from './ink-mask.js';
import { createRaster, fillRect } from './raster.js';
import {
  checkerboardRaster,
  drawGlyphBars,
  gradientRaster,
  solidRaster,
} from './testing/synthetic.js';

const WHITE = createRgb(255, 255, 255);
const BLACK = createRgb(0, 0, 0);

function glyphImage(options: {
  readonly strokeWidth: number;
  readonly gap: number;
  readonly count: number;
  readonly height: number;
}) {
  const raster = createRaster(80, 30, WHITE);
  drawGlyphBars(raster, {
    x: 4,
    y: 4,
    height: options.height,
    strokeWidth: options.strokeWidth,
    gap: options.gap,
    count: options.count,
  });
  return inkMaskToGray(buildInkMask(toGrayscale(raster)));
}

describe('gaussianKernel', () => {
  it('sums to one', () => {
    const kernel = gaussianKernel(11, 1.5);
    expect([...kernel].reduce((total, weight) => total + weight, 0)).toBeCloseTo(1, 10);
  });

  it('peaks at the center and is symmetric', () => {
    const kernel = gaussianKernel(5, 1);
    expect(kernel[12]).toBeGreaterThan(kernel[0]!);
    expect(kernel[0]).toBeCloseTo(kernel[24]!, 12);
  });

  it('rejects even sizes and non-positive sigma', () => {
    expect(() => gaussianKernel(4, 1)).toThrow(RangeError);
    expect(() => gaussianKernel(5, 0)).toThrow(RangeError);
  });
});

describe('ssim', () => {
  it('scores an image against itself as 1', () => {
    const image = toGrayscale(checkerboardRaster(40, 40, 4, WHITE, BLACK));
    expect(ssim(image, image).score).toBeCloseTo(1, 6);
  });

  it('scores an inverted image far below a matching one', () => {
    const image = toGrayscale(checkerboardRaster(40, 40, 4, WHITE, BLACK));
    const inverted = createGrayImage(image.width, image.height);
    for (let index = 0; index < image.data.length; index += 1) {
      inverted.data[index] = 255 - (image.data[index] as number);
    }
    expect(ssim(image, inverted).score).toBeLessThan(0);
  });

  it('is symmetric', () => {
    const a = toGrayscale(gradientRaster(40, 40));
    const b = toGrayscale(checkerboardRaster(40, 40, 5, WHITE, BLACK));
    expect(ssim(a, b).score).toBeCloseTo(ssim(b, a).score, 10);
  });

  it('degrades smoothly as noise grows', () => {
    const base = toGrayscale(gradientRaster(40, 40));
    const nudged = createGrayImage(base.width, base.height);
    const shifted = createGrayImage(base.width, base.height);
    for (let index = 0; index < base.data.length; index += 1) {
      nudged.data[index] = Math.min(255, (base.data[index] as number) + 2);
      shifted.data[index] = Math.min(255, (base.data[index] as number) + 40);
    }

    expect(ssim(base, nudged).score).toBeGreaterThan(ssim(base, shifted).score);
    expect(ssim(base, nudged).score).toBeGreaterThan(0.9);
  });

  it('shrinks the window to fit a small crop', () => {
    // A 3x3 window still fits a 4x4 crop, giving four positions.
    expect(ssim(createGrayImage(4, 4, 200), createGrayImage(4, 4, 200)).windowCount).toBe(4);
  });

  it('falls back to a single global window when no window fits', () => {
    const result = ssim(createGrayImage(2, 2, 200), createGrayImage(2, 2, 200));
    expect(result.windowCount).toBe(1);
    expect(result.score).toBeCloseTo(1, 6);
  });

  it('refuses mismatched sizes rather than guessing an alignment', () => {
    expect(() => ssim(createGrayImage(10, 10), createGrayImage(10, 12))).toThrow(RangeError);
  });

  it('rejects invalid options', () => {
    const image = createGrayImage(20, 20);
    expect(() => ssim(image, image, { ...DEFAULT_SSIM_OPTIONS, windowSize: 10 })).toThrow(
      RangeError,
    );
    expect(() => ssim(image, image, { ...DEFAULT_SSIM_OPTIONS, sigma: 0 })).toThrow(RangeError);
    expect(() => ssim(image, image, { ...DEFAULT_SSIM_OPTIONS, dynamicRange: 0 })).toThrow(
      RangeError,
    );
  });

  it('separates two glyph shapes well enough to pick a family', () => {
    const design = glyphImage({ strokeWidth: 2, gap: 4, count: 8, height: 20 });
    const sameShape = glyphImage({ strokeWidth: 2, gap: 4, count: 8, height: 20 });
    const otherShape = glyphImage({ strokeWidth: 5, gap: 1, count: 8, height: 20 });

    const matching = ssim(...alignForShapeComparison(design, sameShape)).score;
    const different = ssim(...alignForShapeComparison(design, otherShape)).score;

    expect(matching).toBeGreaterThan(0.95);
    expect(matching - different).toBeGreaterThan(0.05);
  });
});

describe('resizeBilinear', () => {
  it('returns a copy when the size is unchanged', () => {
    const image = toGrayscale(gradientRaster(8, 8));
    const resized = resizeBilinear(image, 8, 8);
    expect([...resized.data]).toEqual([...image.data]);
    expect(resized.data).not.toBe(image.data);
  });

  it('preserves a flat field exactly', () => {
    const flat = toGrayscale(solidRaster(16, 16, createRgb(128, 128, 128)));
    const resized = resizeBilinear(flat, 7, 5);
    expect([...new Set(resized.data)]).toEqual([128]);
  });

  it('keeps a gradient monotonic after downscaling', () => {
    const resized = resizeBilinear(toGrayscale(gradientRaster(64, 4)), 16, 4);
    for (let x = 1; x < resized.width; x += 1) {
      expect(resized.data[x]!).toBeGreaterThanOrEqual(resized.data[x - 1]!);
    }
  });

  it('rejects invalid target sizes', () => {
    const image = createGrayImage(4, 4);
    expect(() => resizeBilinear(image, 0, 4)).toThrow(RangeError);
    expect(() => resizeBilinear(image, 4, 1.5)).toThrow(RangeError);
  });
});

describe('padToWidth', () => {
  it('centers the source on a wider canvas', () => {
    const image = createGrayImage(2, 1, 10);
    const padded = padToWidth(image, 6, 255);
    expect([...padded.data]).toEqual([255, 255, 10, 10, 255, 255]);
  });

  it('refuses to shrink', () => {
    expect(() => padToWidth(createGrayImage(10, 1), 4, 0)).toThrow(RangeError);
  });
});

describe('alignForShapeComparison', () => {
  it('brings differently-sized crops into one comparable frame', () => {
    const small = toGrayscale(createRaster(20, 10, WHITE));
    const large = toGrayscale(createRaster(200, 50, WHITE));
    const [a, b] = alignForShapeComparison(small, large);

    expect(a.width).toBe(b.width);
    expect(a.height).toBe(b.height);
    expect(a.height).toBe(32);
  });

  it('scores the same shape at two sizes far above a different shape', () => {
    const build = (scale: number, inkWidth: number) => {
      const raster = createRaster(20 * scale, 10 * scale, WHITE);
      fillRect(raster, createBox(4 * scale, 2 * scale, (4 + inkWidth) * scale, 8 * scale), BLACK);
      return toGrayscale(raster);
    };

    // Upscaling softens edges, so an identical shape at 4x does not reach 1.0.
    const sameShape = ssim(...alignForShapeComparison(build(1, 12), build(4, 12))).score;
    const otherShape = ssim(...alignForShapeComparison(build(1, 12), build(4, 3))).score;

    expect(sameShape).toBeGreaterThan(0.85);
    expect(sameShape - otherShape).toBeGreaterThan(0.2);
  });

  it('rejects a degenerate target height', () => {
    const image = createGrayImage(10, 10);
    expect(() => alignForShapeComparison(image, image, { targetHeight: 1, padValue: 255 })).toThrow(
      RangeError,
    );
  });
});

describe('inkMaskToGray', () => {
  it('renders ink as black on white', () => {
    const raster = createRaster(4, 2, WHITE);
    fillRect(raster, createBox(0, 0, 2, 2), BLACK);
    const gray = inkMaskToGray(buildInkMask(toGrayscale(raster)));
    expect([...gray.data]).toEqual([0, 0, 255, 255, 0, 0, 255, 255]);
  });
});
