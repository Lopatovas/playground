import { describe, expect, it } from 'vitest';
import { createBox, createRgb } from '@bulwark/domain';
import {
  cloneRaster,
  createRaster,
  cropRaster,
  fillRect,
  flattenOnto,
  getAlpha,
  getPixel,
  rasterFromBuffer,
  rastersEqual,
  setPixel,
} from './raster.js';
import { decodePng, encodePng } from './png.js';
import { checkerboardRaster, gradientRaster } from './testing/synthetic.js';

const RED = createRgb(255, 0, 0);
const BLUE = createRgb(0, 0, 255);
const WHITE = createRgb(255, 255, 255);

describe('createRaster', () => {
  it('starts opaque and black unless filled', () => {
    const raster = createRaster(2, 2);
    expect(getPixel(raster, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
    expect(getAlpha(raster, 0, 0)).toBe(255);
  });

  it('fills every pixel when given a color', () => {
    const raster = createRaster(3, 2, RED);
    expect(getPixel(raster, 2, 1)).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('rejects invalid dimensions', () => {
    expect(() => createRaster(0, 5)).toThrow(RangeError);
    expect(() => createRaster(5, -1)).toThrow(RangeError);
    expect(() => createRaster(2.5, 2)).toThrow(RangeError);
  });
});

describe('rasterFromBuffer', () => {
  it('rejects a buffer that does not match the dimensions', () => {
    expect(() => rasterFromBuffer(2, 2, new Uint8Array(15))).toThrow(RangeError);
  });

  it('accepts an exactly-sized buffer', () => {
    expect(rasterFromBuffer(2, 2, new Uint8Array(16)).width).toBe(2);
  });
});

describe('pixel access', () => {
  it('rejects out-of-bounds and fractional coordinates', () => {
    const raster = createRaster(4, 4);
    expect(() => getPixel(raster, 4, 0)).toThrow(RangeError);
    expect(() => getPixel(raster, -1, 0)).toThrow(RangeError);
    expect(() => getPixel(raster, 1.5, 0)).toThrow(RangeError);
  });

  it('round-trips a written pixel', () => {
    const raster = createRaster(4, 4);
    setPixel(raster, 2, 3, BLUE, 128);
    expect(getPixel(raster, 2, 3)).toEqual({ r: 0, g: 0, b: 255 });
    expect(getAlpha(raster, 2, 3)).toBe(128);
  });
});

describe('fillRect', () => {
  it('fills the half-open box only', () => {
    const raster = createRaster(5, 5, WHITE);
    fillRect(raster, createBox(1, 1, 3, 3), RED);

    expect(getPixel(raster, 1, 1)).toEqual({ r: 255, g: 0, b: 0 });
    expect(getPixel(raster, 2, 2)).toEqual({ r: 255, g: 0, b: 0 });
    expect(getPixel(raster, 3, 3)).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('clips a box that hangs off the edge', () => {
    const raster = createRaster(4, 4, WHITE);
    fillRect(raster, createBox(2, 2, 10, 10), RED);
    expect(getPixel(raster, 3, 3)).toEqual({ r: 255, g: 0, b: 0 });
  });
});

describe('cropRaster', () => {
  it('extracts the requested region', () => {
    const raster = checkerboardRaster(8, 8, 2, RED, BLUE);
    const crop = cropRaster(raster, createBox(2, 2, 6, 6));

    expect([crop.width, crop.height]).toEqual([4, 4]);
    expect(getPixel(crop, 0, 0)).toEqual(getPixel(raster, 2, 2));
    expect(getPixel(crop, 3, 3)).toEqual(getPixel(raster, 5, 5));
  });

  it('clips a detector box that hangs off the edge', () => {
    const raster = createRaster(8, 8, RED);
    const crop = cropRaster(raster, createBox(6, 6, 20, 20));
    expect([crop.width, crop.height]).toEqual([2, 2]);
  });

  it('snaps fractional boxes outwards', () => {
    const raster = createRaster(10, 10, RED);
    const crop = cropRaster(raster, createBox(1.4, 1.6, 5.2, 5.9));
    expect([crop.width, crop.height]).toEqual([5, 5]);
  });

  it('refuses a box with no overlap', () => {
    const raster = createRaster(8, 8, RED);
    expect(() => cropRaster(raster, createBox(20, 20, 30, 30))).toThrow(/no overlap/);
  });

  it('does not alias the source buffer', () => {
    const raster = createRaster(4, 4, RED);
    const crop = cropRaster(raster, createBox(0, 0, 2, 2));
    setPixel(crop, 0, 0, BLUE);
    expect(getPixel(raster, 0, 0)).toEqual({ r: 255, g: 0, b: 0 });
  });
});

describe('cloneRaster and rastersEqual', () => {
  it('clones into an independent buffer', () => {
    const raster = gradientRaster(6, 3);
    const clone = cloneRaster(raster);
    expect(rastersEqual(raster, clone)).toBe(true);

    setPixel(clone, 0, 0, RED);
    expect(rastersEqual(raster, clone)).toBe(false);
  });

  it('treats different dimensions as unequal', () => {
    expect(rastersEqual(createRaster(2, 2), createRaster(2, 3))).toBe(false);
  });
});

describe('flattenOnto', () => {
  it('composites transparency onto a known background', () => {
    const raster = createRaster(1, 1);
    setPixel(raster, 0, 0, createRgb(0, 0, 0), 0);
    const flattened = flattenOnto(raster, WHITE);

    expect(getPixel(flattened, 0, 0)).toEqual({ r: 255, g: 255, b: 255 });
    expect(getAlpha(flattened, 0, 0)).toBe(255);
  });

  it('blends a half-transparent pixel', () => {
    const raster = createRaster(1, 1);
    setPixel(raster, 0, 0, createRgb(0, 0, 0), 128);
    expect(getPixel(flattenOnto(raster, WHITE), 0, 0)).toEqual({ r: 127, g: 127, b: 127 });
  });

  it('leaves opaque pixels untouched', () => {
    const raster = createRaster(2, 2, RED);
    expect(rastersEqual(flattenOnto(raster, WHITE), raster)).toBe(true);
  });
});

describe('PNG codec', () => {
  it('round-trips a raster losslessly', () => {
    const raster = checkerboardRaster(16, 9, 3, RED, BLUE);
    expect(rastersEqual(decodePng(encodePng(raster)), raster)).toBe(true);
  });

  it('preserves the alpha channel', () => {
    const raster = createRaster(2, 2, RED);
    setPixel(raster, 1, 1, BLUE, 64);
    expect(getAlpha(decodePng(encodePng(raster)), 1, 1)).toBe(64);
  });

  it('encodes the same raster to identical bytes', () => {
    const raster = gradientRaster(32, 8);
    expect(Buffer.from(encodePng(raster)).equals(Buffer.from(encodePng(cloneRaster(raster))))).toBe(
      true,
    );
  });

  it('rejects bytes that are not a PNG', () => {
    expect(() => decodePng(new Uint8Array([1, 2, 3, 4]))).toThrow();
  });
});
