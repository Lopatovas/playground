import { clamp } from '@bulwark/domain';
import type { GrayImage } from './grayscale.js';
import { createGrayImage } from './grayscale.js';
import type { InkMask } from './ink-mask.js';

/** Bilinear resample of a grayscale image. */
export function resizeBilinear(image: GrayImage, width: number, height: number): GrayImage {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(
      `resizeBilinear() requires positive integer dimensions, received ${width}x${height}`,
    );
  }
  if (image.width === width && image.height === height) {
    return { width, height, data: new Uint8Array(image.data) };
  }

  const out = createGrayImage(width, height);
  const scaleX = image.width / width;
  const scaleY = image.height / height;

  for (let y = 0; y < height; y += 1) {
    const sourceY = clamp((y + 0.5) * scaleY - 0.5, 0, image.height - 1);
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(y0 + 1, image.height - 1);
    const weightY = sourceY - y0;

    for (let x = 0; x < width; x += 1) {
      const sourceX = clamp((x + 0.5) * scaleX - 0.5, 0, image.width - 1);
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(x0 + 1, image.width - 1);
      const weightX = sourceX - x0;

      const topLeft = image.data[y0 * image.width + x0] as number;
      const topRight = image.data[y0 * image.width + x1] as number;
      const bottomLeft = image.data[y1 * image.width + x0] as number;
      const bottomRight = image.data[y1 * image.width + x1] as number;

      const top = topLeft + (topRight - topLeft) * weightX;
      const bottom = bottomLeft + (bottomRight - bottomLeft) * weightX;
      out.data[y * width + x] = Math.round(top + (bottom - top) * weightY);
    }
  }

  return out;
}

/** Centers an image on a wider canvas filled with `fill`. */
export function padToWidth(image: GrayImage, width: number, fill: number): GrayImage {
  if (width < image.width) {
    throw new RangeError(`padToWidth() cannot shrink ${image.width}px to ${width}px`);
  }
  if (width === image.width) return image;

  const out = createGrayImage(width, image.height, fill);
  const offset = Math.floor((width - image.width) / 2);
  for (let y = 0; y < image.height; y += 1) {
    out.data.set(image.data.subarray(y * image.width, (y + 1) * image.width), y * width + offset);
  }
  return out;
}

/** Renders an ink mask as a grayscale image with ink at 0 and paper at 255. */
export function inkMaskToGray(mask: InkMask): GrayImage {
  const out = createGrayImage(mask.width, mask.height);
  for (let index = 0; index < mask.data.length; index += 1) {
    out.data[index] = mask.data[index] === 1 ? 0 : 255;
  }
  return out;
}

export interface ShapeComparisonOptions {
  /** Height both images are scaled to before comparison. */
  readonly targetHeight: number;
  /** Value used to pad the narrower image. */
  readonly padValue: number;
}

export const DEFAULT_SHAPE_COMPARISON_OPTIONS: ShapeComparisonOptions = {
  targetHeight: 32,
  padValue: 255,
};

/**
 * Brings two glyph images into a common frame so SSIM measures letter shape rather
 * than crop size.
 *
 * Both are scaled to the same height, preserving aspect ratio, and the narrower one
 * is centered on a canvas as wide as the other. Comparing at a fixed height is what
 * makes the score answer "are these the same typeface" instead of "were these
 * rendered at the same size", which the font-size check already covers.
 */
export function alignForShapeComparison(
  a: GrayImage,
  b: GrayImage,
  options: ShapeComparisonOptions = DEFAULT_SHAPE_COMPARISON_OPTIONS,
): readonly [GrayImage, GrayImage] {
  if (!Number.isInteger(options.targetHeight) || options.targetHeight < 2) {
    throw new RangeError('alignForShapeComparison() requires targetHeight >= 2');
  }

  const scaled = [a, b].map((image) => {
    const width = Math.max(1, Math.round((image.width / image.height) * options.targetHeight));
    return resizeBilinear(image, width, options.targetHeight);
  }) as [GrayImage, GrayImage];

  const width = Math.max(scaled[0].width, scaled[1].width);
  return [
    padToWidth(scaled[0], width, options.padValue),
    padToWidth(scaled[1], width, options.padValue),
  ];
}
