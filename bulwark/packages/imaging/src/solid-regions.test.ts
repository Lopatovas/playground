import { describe, expect, it } from 'vitest';
import { createBox, createRgb, labChroma } from '@bulwark/domain';
import {
  filterSolidFillsAgainstExisting,
  proposeSolidFillRegions,
} from './solid-regions.js';
import { createRaster, fillRect, setPixel } from './raster.js';

const WHITE = createRgb(255, 255, 255);
const TEAL = createRgb(13, 148, 136);
const CORAL = createRgb(251, 113, 133);
const AMBER = createRgb(245, 158, 11);
const BLUE = createRgb(37, 99, 235);
const WASH = createRgb(219, 234, 254); // #dbeafe range-day wash

describe('proposeSolidFillRegions', () => {
  it('finds flat KPI-style tiles on a page background', () => {
    const raster = createRaster(400, 240, WHITE);
    fillRect(raster, createBox(20, 20, 120, 100), TEAL);
    fillRect(raster, createBox(140, 20, 240, 100), CORAL);
    fillRect(raster, createBox(260, 20, 360, 100), AMBER);

    const regions = proposeSolidFillRegions(raster, { scale: 2, minSidePx: 8 });
    expect(regions.length).toBeGreaterThanOrEqual(3);
    expect(regions.every((region) => region.solidity >= 0.78)).toBe(true);
    expect(regions.every((region) => region.purity >= 0.62)).toBe(true);
  });

  it('keeps a pill with white glyph text (glyph-aware purity)', () => {
    const raster = createRaster(200, 120, WHITE);
    fillRect(raster, createBox(40, 40, 120, 70), CORAL);
    // White label strokes that used to tank raw purity.
    for (let x = 55; x < 105; x += 1) {
      for (let y = 50; y < 60; y += 1) {
        setPixel(raster, x, y, WHITE);
      }
    }

    const regions = proposeSolidFillRegions(raster, {
      scale: 1,
      minSidePx: 8,
      minAreaFraction: 0.01,
      maxAreaFraction: 0.5,
    });
    const pill = regions.find(
      (region) =>
        region.box.xMin <= 40 &&
        region.box.xMax >= 120 &&
        region.box.yMin <= 40 &&
        region.box.yMax >= 70,
    );
    expect(pill).toBeDefined();
    expect(pill!.purity).toBeGreaterThanOrEqual(0.62);
    expect(labChroma(pill!.fill)).toBeGreaterThan(20);
  });

  it('prefers a saturated day over a washed neighbor when they overlap', () => {
    const raster = createRaster(200, 100, WHITE);
    fillRect(raster, createBox(20, 20, 70, 70), WASH);
    fillRect(raster, createBox(50, 20, 100, 70), BLUE);

    const regions = proposeSolidFillRegions(raster, {
      scale: 1,
      minSidePx: 8,
      minAreaFraction: 0.01,
      maxAreaFraction: 0.5,
    });
    // Overlapping proposals collapse to the blue day.
    const blues = regions.filter((region) => labChroma(region.fill) > 30);
    expect(blues.length).toBeGreaterThanOrEqual(1);
    expect(blues[0]!.fill.b).toBeGreaterThan(blues[0]!.fill.r);
  });

  it('rejects a multi-color pie-like disk (low purity / solidity)', () => {
    const raster = createRaster(200, 200, WHITE);
    fillRect(raster, createBox(40, 40, 100, 160), TEAL);
    fillRect(raster, createBox(100, 40, 160, 160), CORAL);
    for (let y = 40; y < 160; y += 1) {
      for (let x = 40; x < 160; x += 1) {
        if (((x + y) & 3) === 0) {
          const offset = (y * 200 + x) * 4;
          raster.data[offset] = 30;
          raster.data[offset + 1] = 30;
          raster.data[offset + 2] = 30;
        }
      }
    }

    const regions = proposeSolidFillRegions(raster, {
      scale: 1,
      minAreaFraction: 0.01,
      maxAreaFraction: 0.5,
      minPurity: 0.72,
      minSolidity: 0.82,
    });
    expect(
      regions.every((region) => {
        const w = region.box.xMax - region.box.xMin;
        const h = region.box.yMax - region.box.yMin;
        return w * h < 100 * 100;
      }),
    ).toBe(true);
  });

  it('suppresses proposals already covered by detector boxes', () => {
    const raster = createRaster(400, 300, WHITE);
    fillRect(raster, createBox(40, 40, 120, 100), TEAL);
    const proposals = proposeSolidFillRegions(raster, { scale: 1, minSidePx: 8 });
    expect(proposals.length).toBeGreaterThanOrEqual(1);
    const filtered = filterSolidFillsAgainstExisting(proposals, [createBox(35, 35, 125, 105)]);
    expect(filtered).toHaveLength(0);
  });

  it('keeps a saturated proposal over a washed covering detector box', () => {
    const raster = createRaster(200, 100, WHITE);
    fillRect(raster, createBox(20, 20, 90, 70), WASH);
    fillRect(raster, createBox(40, 25, 80, 65), BLUE);
    const proposals = proposeSolidFillRegions(raster, {
      scale: 1,
      minSidePx: 6,
      minAreaFraction: 0.005,
      maxAreaFraction: 0.5,
    });
    const blue = proposals.find((region) => labChroma(region.fill) > 40);
    expect(blue).toBeDefined();
    const filtered = filterSolidFillsAgainstExisting(
      proposals,
      [createBox(18, 18, 92, 72)],
      {},
      raster,
    );
    expect(filtered.some((region) => labChroma(region.fill) > 40)).toBe(true);
  });
});
