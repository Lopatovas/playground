import type { BoundingBox, Rgb, Size } from '@bulwark/domain';
import { toPixelBox } from '@bulwark/domain';

export const CHANNELS = 4;

/**
 * An 8-bit RGBA image held as a flat row-major buffer.
 *
 * Everything downstream (masks, palettes, similarity) reads this one shape, so a
 * screenshot from Playwright and a reference render from a headless canvas become
 * interchangeable inputs.
 */
export interface Raster {
  readonly width: number;
  readonly height: number;
  /** `width * height * 4` bytes, RGBA order, no row padding. */
  readonly data: Uint8Array;
}

export function createRaster(width: number, height: number, fill?: Rgb): Raster {
  assertDimensions(width, height);
  const data = new Uint8Array(width * height * CHANNELS);
  if (fill !== undefined) {
    for (let index = 0; index < data.length; index += CHANNELS) {
      data[index] = fill.r;
      data[index + 1] = fill.g;
      data[index + 2] = fill.b;
      data[index + 3] = 255;
    }
  } else {
    for (let index = 3; index < data.length; index += CHANNELS) {
      data[index] = 255;
    }
  }
  return { width, height, data };
}

export function rasterFromBuffer(width: number, height: number, data: Uint8Array): Raster {
  assertDimensions(width, height);
  const expected = width * height * CHANNELS;
  if (data.length !== expected) {
    throw new RangeError(
      `Raster buffer length ${data.length} does not match ${width}x${height} RGBA (${expected} bytes)`,
    );
  }
  return { width, height, data };
}

export function rasterSize(raster: Raster): Size {
  return { width: raster.width, height: raster.height };
}

export function pixelIndex(raster: Raster, x: number, y: number): number {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    throw new RangeError(`Pixel coordinates must be integers, received (${x}, ${y})`);
  }
  if (x < 0 || y < 0 || x >= raster.width || y >= raster.height) {
    throw new RangeError(
      `Pixel (${x}, ${y}) is outside a ${raster.width}x${raster.height} raster`,
    );
  }
  return (y * raster.width + x) * CHANNELS;
}

export function getPixel(raster: Raster, x: number, y: number): Rgb {
  const index = pixelIndex(raster, x, y);
  return {
    r: raster.data[index] as number,
    g: raster.data[index + 1] as number,
    b: raster.data[index + 2] as number,
  };
}

export function getAlpha(raster: Raster, x: number, y: number): number {
  return raster.data[pixelIndex(raster, x, y) + 3] as number;
}

export function setPixel(raster: Raster, x: number, y: number, color: Rgb, alpha = 255): void {
  const index = pixelIndex(raster, x, y);
  raster.data[index] = color.r;
  raster.data[index + 1] = color.g;
  raster.data[index + 2] = color.b;
  raster.data[index + 3] = alpha;
}

export function fillRect(raster: Raster, box: BoundingBox, color: Rgb, alpha = 255): void {
  const pixels = toPixelBox(box, rasterSize(raster));
  for (let y = pixels.yMin; y < pixels.yMax; y += 1) {
    for (let x = pixels.xMin; x < pixels.xMax; x += 1) {
      setPixel(raster, x, y, color, alpha);
    }
  }
}

/**
 * Extracts a sub-image. The box is snapped to whole pixels and clipped to the
 * raster, so a detector box that hangs off the edge still yields a usable crop.
 */
export function cropRaster(raster: Raster, box: BoundingBox): Raster {
  const pixels = toPixelBox(box, rasterSize(raster));
  const width = pixels.xMax - pixels.xMin;
  const height = pixels.yMax - pixels.yMin;
  if (width <= 0 || height <= 0) {
    throw new RangeError(
      `Crop box [${box.xMin}, ${box.yMin}, ${box.xMax}, ${box.yMax}] has no overlap with the ` +
        `${raster.width}x${raster.height} raster`,
    );
  }

  const out = createRaster(width, height);
  for (let y = 0; y < height; y += 1) {
    const sourceStart = ((pixels.yMin + y) * raster.width + pixels.xMin) * CHANNELS;
    const targetStart = y * width * CHANNELS;
    out.data.set(raster.data.subarray(sourceStart, sourceStart + width * CHANNELS), targetStart);
  }
  return out;
}

export function cloneRaster(raster: Raster): Raster {
  return { width: raster.width, height: raster.height, data: new Uint8Array(raster.data) };
}

export function rastersEqual(a: Raster, b: Raster): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  for (let index = 0; index < a.data.length; index += 1) {
    if (a.data[index] !== b.data[index]) return false;
  }
  return true;
}

/**
 * Flattens transparency onto an opaque background.
 *
 * Design exports frequently carry an alpha channel while a browser screenshot does
 * not; comparing them without compositing would read transparent pixels as black
 * and invent color defects.
 */
export function flattenOnto(raster: Raster, background: Rgb): Raster {
  const out = createRaster(raster.width, raster.height);
  for (let index = 0; index < raster.data.length; index += CHANNELS) {
    const alpha = (raster.data[index + 3] as number) / 255;
    out.data[index] = blend(raster.data[index] as number, background.r, alpha);
    out.data[index + 1] = blend(raster.data[index + 1] as number, background.g, alpha);
    out.data[index + 2] = blend(raster.data[index + 2] as number, background.b, alpha);
    out.data[index + 3] = 255;
  }
  return out;
}

function blend(foreground: number, background: number, alpha: number): number {
  return Math.round(foreground * alpha + background * (1 - alpha));
}

function assertDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new RangeError(`Raster dimensions must be integers, received ${width}x${height}`);
  }
  if (width <= 0 || height <= 0) {
    throw new RangeError(`Raster dimensions must be positive, received ${width}x${height}`);
  }
}
