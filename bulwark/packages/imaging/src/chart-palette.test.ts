import { describe, expect, it } from 'vitest';
import { createBox, createRgb, deltaE2000Rgb, toHex } from '@bulwark/domain';
import { extractSeriesPalette, matchSeriesPalettes } from './chart-palette.js';
import { createRaster, fillRect } from './raster.js';

const BLUE = createRgb(37, 99, 235);
const GREEN = createRgb(34, 197, 94);
const AMBER = createRgb(245, 158, 11);

function pieLikeRaster() {
  const raster = createRaster(60, 60, createRgb(255, 255, 255));
  fillRect(raster, createBox(5, 5, 30, 55), BLUE);
  fillRect(raster, createBox(30, 5, 55, 30), GREEN);
  fillRect(raster, createBox(30, 30, 55, 55), AMBER);
  return raster;
}

describe('extractSeriesPalette', () => {
  it('recovers chromatic stops and drops paper', () => {
    const stops = extractSeriesPalette(pieLikeRaster());
    expect(stops.length).toBeGreaterThanOrEqual(3);
    for (const seed of [BLUE, GREEN, AMBER]) {
      const nearest = Math.min(...stops.map((stop) => deltaE2000Rgb(seed, stop)));
      expect(nearest).toBeLessThan(5);
    }
    expect(stops.every((stop) => toHex(stop) !== '#ffffff')).toBe(true);
  });
});

describe('matchSeriesPalettes', () => {
  it('pairs nearest stops greedily', () => {
    const design = [BLUE, GREEN];
    const live = [GREEN, BLUE];
    const matches = matchSeriesPalettes(design, live);
    expect(matches).toHaveLength(2);
    expect(matches.every((m) => m.deltaE2000 < 1)).toBe(true);
  });
});
