import type { Raster } from './raster.js';
import { CHANNELS } from './raster.js';

/** Single-channel luminance image, values in 0..255. */
export interface GrayImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
}

/**
 * Converts to luminance with the Rec. 601 weights.
 *
 * Perceptual weighting matters here: an equal-weight average makes light blue text
 * on white and mid-grey text on white look equally dark, which would put them in
 * different weight bands for no visual reason.
 */
export function toGrayscale(raster: Raster): GrayImage {
  const data = new Uint8Array(raster.width * raster.height);
  for (let pixel = 0; pixel < data.length; pixel += 1) {
    const offset = pixel * CHANNELS;
    const r = raster.data[offset] as number;
    const g = raster.data[offset + 1] as number;
    const b = raster.data[offset + 2] as number;
    data[pixel] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return { width: raster.width, height: raster.height, data };
}

export function grayAt(image: GrayImage, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    throw new RangeError(`Pixel (${x}, ${y}) is outside a ${image.width}x${image.height} image`);
  }
  return image.data[y * image.width + x] as number;
}

export function createGrayImage(width: number, height: number, fill = 0): GrayImage {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new RangeError(
      `Gray image dimensions must be positive integers, received ${width}x${height}`,
    );
  }
  const data = new Uint8Array(width * height);
  if (fill !== 0) data.fill(fill);
  return { width, height, data };
}

/** 256-bin intensity histogram, the input to Otsu thresholding. */
export function histogram(image: GrayImage): Uint32Array {
  const bins = new Uint32Array(256);
  for (const value of image.data) {
    bins[value] = (bins[value] as number) + 1;
  }
  return bins;
}
