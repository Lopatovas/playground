import { describe, expect, it } from 'vitest';
import { assignPaletteRoles, createBox, createRgb, toHex } from '@bulwark/domain';
import { clusterColors } from './kmeans.js';
import { createRaster, fillRect } from './raster.js';
import { buttonRaster, gradientRaster, solidRaster } from './testing/synthetic.js';

const WHITE = createRgb(255, 255, 255);
const NAVY = createRgb(17, 24, 39);
const BLUE = createRgb(37, 99, 235);

describe('clusterColors', () => {
  it('collapses a flat fill into a single pool', () => {
    const result = clusterColors(solidRaster(20, 20, BLUE));

    expect(result.clusters).toHaveLength(1);
    expect(toHex(result.clusters[0]!.color)).toBe('#2563eb');
    expect(result.clusters[0]!.share).toBe(1);
    expect(result.converged).toBe(true);
  });

  it('separates a two-tone crop and orders pools by dominance', () => {
    const raster = createRaster(20, 10, WHITE);
    fillRect(raster, createBox(0, 0, 4, 10), NAVY);
    const result = clusterColors(raster);

    expect(toHex(result.clusters[0]!.color)).toBe('#ffffff');
    expect(result.clusters[0]!.share).toBeCloseTo(0.8, 6);
    expect(toHex(result.clusters[1]!.color)).toBe('#111827');
    expect(result.clusters[1]!.share).toBeCloseTo(0.2, 6);
  });

  it('recovers the button fill and text color through the anti-aliasing halo', () => {
    const raster = buttonRaster({
      width: 160,
      height: 48,
      background: BLUE,
      foreground: WHITE,
      inkBox: { xMin: 40, yMin: 16, xMax: 120, yMax: 32 },
    });

    const roles = assignPaletteRoles(clusterColors(raster).clusters);
    expect(toHex(roles.background.color)).toBe('#2563eb');
    expect(roles.foreground).not.toBeNull();
    expect(toHex(roles.foreground!.color)).toBe('#ffffff');
  });

  it('never samples a single pixel: a centered glyph does not become the background', () => {
    const raster = createRaster(60, 30, BLUE);
    // Ink straight through the geometric center, where naive sampling would look.
    fillRect(raster, createBox(20, 12, 40, 18), WHITE);
    const roles = assignPaletteRoles(clusterColors(raster).clusters);

    expect(toHex(roles.background.color)).toBe('#2563eb');
  });

  it('produces identical output across runs', () => {
    const raster = buttonRaster({
      width: 120,
      height: 40,
      background: BLUE,
      foreground: WHITE,
      inkBox: { xMin: 20, yMin: 12, xMax: 90, yMax: 28 },
    });

    const first = clusterColors(raster);
    const second = clusterColors(raster);
    expect(JSON.stringify(first.clusters)).toBe(JSON.stringify(second.clusters));
  });

  it('is unaffected by the platform RNG state', () => {
    const raster = gradientRaster(64, 16);
    const first = clusterColors(raster);
    // Any dependence on Math.random would surface as a different partition here.
    for (let index = 0; index < 50; index += 1) Math.random();
    const second = clusterColors(raster);
    expect(JSON.stringify(first.clusters)).toBe(JSON.stringify(second.clusters));
  });

  it('honours a different seed as a deliberate choice, not a coin flip', () => {
    const raster = gradientRaster(64, 16);
    const a = clusterColors(raster, { seed: 1 });
    const b = clusterColors(raster, { seed: 1 });
    expect(JSON.stringify(a.clusters)).toBe(JSON.stringify(b.clusters));
    expect(a.clusters.length).toBeGreaterThan(1);
  });

  it('caps sampling on large crops while staying deterministic', () => {
    const raster = gradientRaster(400, 400);
    const result = clusterColors(raster, { maxSamples: 5000 });

    expect(result.sampledPixelCount).toBeLessThanOrEqual(5000);
    expect(JSON.stringify(result.clusters)).toBe(
      JSON.stringify(clusterColors(raster, { maxSamples: 5000 }).clusters),
    );
  });

  it('reduces k to the number of distinct colors available', () => {
    const raster = createRaster(10, 10, WHITE);
    fillRect(raster, createBox(0, 0, 5, 10), NAVY);
    expect(clusterColors(raster, { k: 8 }).clusters).toHaveLength(2);
  });

  it('reports shares that sum to one', () => {
    const raster = buttonRaster({
      width: 80,
      height: 24,
      background: BLUE,
      foreground: WHITE,
      inkBox: { xMin: 10, yMin: 6, xMax: 60, yMax: 18 },
    });
    const total = clusterColors(raster).clusters.reduce((sum, cluster) => sum + cluster.share, 0);
    expect(total).toBeCloseTo(1, 4);
  });

  it('rejects invalid options', () => {
    const raster = solidRaster(4, 4, WHITE);
    expect(() => clusterColors(raster, { k: 0 })).toThrow(RangeError);
    expect(() => clusterColors(raster, { k: 32 })).toThrow(RangeError);
    expect(() => clusterColors(raster, { maxIterations: 0 })).toThrow(RangeError);
    expect(() => clusterColors(raster, { tolerance: -1 })).toThrow(RangeError);
    expect(() => clusterColors(raster, { maxSamples: 2, k: 4 })).toThrow(RangeError);
  });
});
