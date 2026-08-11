import type { BoundingBox, Rgb } from '@bulwark/domain';
import {
  boxArea,
  boxIntersection,
  createBox,
  createRgb,
  intersectionOverUnion,
  labChroma,
  relativeLuminance,
} from '@bulwark/domain';
import type { Raster } from './raster.js';
import { CHANNELS } from './raster.js';

/**
 * A flat color blob proposed when a UI detector misses tiles/chips/swatches.
 *
 * Pie wedges and photos fail {@link SolidFillRegion.solidity} / {@link SolidFillRegion.purity};
 * page backgrounds fail the area band.
 */
export interface SolidFillRegion {
  readonly box: BoundingBox;
  readonly pixelCount: number;
  /** Filled pixels / bounding-box area. Rect tiles score high; wedges/photos low. */
  readonly solidity: number;
  /**
   * Glyph-aware dominant-bin share: white/black labels on a pill are ignored so
   * purity reflects the fill, not the caption.
   */
  readonly purity: number;
  /** Lab chroma of the fill — saturated chips beat washed siblings in NMS. */
  readonly chroma: number;
  readonly fill: Rgb;
}

export interface ProposeSolidFillOptions {
  /** Spatial downsample factor (≥1). 2–4 keeps the pass cheap on full viewports. */
  readonly scale: number;
  /** RGB quantization step (16 → 16 levels/channel). */
  readonly binSize: number;
  /** Minimum region area as a fraction of the full raster. */
  readonly minAreaFraction: number;
  /** Maximum region area as a fraction of the full raster (drops page BG). */
  readonly maxAreaFraction: number;
  /** Minimum filled-pixels / bbox area. */
  readonly minSolidity: number;
  /** Minimum glyph-aware dominant-bin share inside the bbox. */
  readonly minPurity: number;
  /** Minimum full-resolution side length in px. */
  readonly minSidePx: number;
  /** Cap on returned regions (largest first after chroma preference). */
  readonly maxRegions: number;
  /**
   * Relative-luminance gap vs the fill mean above which a pixel is treated as a
   * glyph/icon and excluded from the purity denominator.
   */
  readonly glyphLuminanceGap: number;
}

export const DEFAULT_PROPOSE_SOLID_FILL_OPTIONS: ProposeSolidFillOptions = {
  scale: 2,
  binSize: 24,
  minAreaFraction: 0.00035,
  maxAreaFraction: 0.12,
  minSolidity: 0.78,
  minPurity: 0.62,
  minSidePx: 6,
  maxRegions: 80,
  glyphLuminanceGap: 0.22,
};

export interface MergeSolidFillOptions extends Partial<ProposeSolidFillOptions> {
  /**
   * Drop a proposal when its intersection with an existing box covers at least this
   * fraction of the proposal (detector already owns that paint).
   */
  readonly maxCoverageByExisting: number;
  /** Drop when IoU with an existing box exceeds this. */
  readonly maxIouWithExisting: number;
  /**
   * Keep a saturated proposal even when an existing box covers it, if the
   * proposal's chroma exceeds the existing crop's chroma by at least this much
   * (selected day vs washed range cell).
   */
  readonly minChromaAdvantage: number;
}

export const DEFAULT_MERGE_SOLID_FILL_OPTIONS: Required<
  Pick<
    MergeSolidFillOptions,
    'maxCoverageByExisting' | 'maxIouWithExisting' | 'minChromaAdvantage'
  >
> = {
  maxCoverageByExisting: 0.55,
  maxIouWithExisting: 0.35,
  minChromaAdvantage: 12,
};

/**
 * Finds high-solidity flat color regions in a screenshot.
 *
 * Quantize → connected components on a downsampled grid → keep rectangular,
 * single-color blobs in a mid size band. Glyphs on pills are ignored for purity.
 * When two proposals overlap, the more saturated fill wins.
 */
export function proposeSolidFillRegions(
  raster: Raster,
  options: Partial<ProposeSolidFillOptions> = {},
): SolidFillRegion[] {
  const opts = { ...DEFAULT_PROPOSE_SOLID_FILL_OPTIONS, ...options };
  const scale = Math.max(1, Math.floor(opts.scale));
  const sw = Math.max(1, Math.floor(raster.width / scale));
  const sh = Math.max(1, Math.floor(raster.height / scale));
  const total = sw * sh;
  if (total === 0) return [];

  const keys = new Int32Array(total);
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const sx = Math.min(raster.width - 1, x * scale);
      const sy = Math.min(raster.height - 1, y * scale);
      const offset = (sy * raster.width + sx) * CHANNELS;
      keys[y * sw + x] = quantizeKey(
        raster.data[offset] as number,
        raster.data[offset + 1] as number,
        raster.data[offset + 2] as number,
        opts.binSize,
      );
    }
  }

  const labels = new Int32Array(total);
  const components: {
    key: number;
    count: number;
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  }[] = [];

  const stackX: number[] = [];
  const stackY: number[] = [];

  for (let start = 0; start < total; start += 1) {
    if (labels[start] !== 0) continue;
    const key = keys[start] as number;
    const id = components.length + 1;
    let count = 0;
    let xMin = sw;
    let yMin = sh;
    let xMax = 0;
    let yMax = 0;

    stackX.push(start % sw);
    stackY.push((start / sw) | 0);
    labels[start] = id;

    while (stackX.length > 0) {
      const x = stackX.pop() as number;
      const y = stackY.pop() as number;
      count += 1;
      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
      if (x + 1 > xMax) xMax = x + 1;
      if (y + 1 > yMax) yMax = y + 1;

      for (const [nx, ny] of neighbors4(x, y, sw, sh)) {
        const nIndex = ny * sw + nx;
        if (labels[nIndex] !== 0) continue;
        if (keys[nIndex] !== key) continue;
        labels[nIndex] = id;
        stackX.push(nx);
        stackY.push(ny);
      }
    }

    components.push({ key, count, xMin, yMin, xMax, yMax });
  }

  const fullArea = raster.width * raster.height;
  const minPixels = Math.max(1, Math.floor(opts.minAreaFraction * fullArea));
  const maxPixels = Math.max(minPixels, Math.floor(opts.maxAreaFraction * fullArea));
  const regions: SolidFillRegion[] = [];

  for (const component of components) {
    const pixelCount = component.count * scale * scale;
    if (pixelCount < minPixels || pixelCount > maxPixels) continue;

    const box = createBox(
      component.xMin * scale,
      component.yMin * scale,
      Math.min(raster.width, component.xMax * scale),
      Math.min(raster.height, component.yMax * scale),
    );
    const width = box.xMax - box.xMin;
    const height = box.yMax - box.yMin;
    if (width < opts.minSidePx || height < opts.minSidePx) continue;

    const area = boxArea(box);
    if (area <= 0) continue;
    const solidity = pixelCount / area;
    if (solidity < opts.minSolidity) continue;

    const fill = meanColorForKey(raster, box, opts.binSize, component.key);
    if (fill === undefined) continue;
    const purity = glyphAwarePurity(
      raster,
      box,
      opts.binSize,
      component.key,
      fill,
      opts.glyphLuminanceGap,
    );
    if (purity < opts.minPurity) continue;

    regions.push({
      box,
      pixelCount,
      solidity,
      purity,
      chroma: labChroma(fill),
      fill,
    });
  }

  // Saturated chips before large washed panels so NMS keeps the real signal.
  regions.sort((a, b) => {
    if (b.chroma !== a.chroma) return b.chroma - a.chroma;
    if (b.purity !== a.purity) return b.purity - a.purity;
    return b.pixelCount - a.pixelCount;
  });
  return nmsRegions(regions, 0.45).slice(0, opts.maxRegions);
}

/**
 * Keeps proposals that are not already covered by detector boxes.
 *
 * Exception: a clearly more saturated proposal survives coverage by a washed
 * detector box (selected calendar day vs pale range cell).
 */
export function filterSolidFillsAgainstExisting(
  proposals: readonly SolidFillRegion[],
  existing: readonly BoundingBox[],
  options: Partial<MergeSolidFillOptions> = {},
  raster?: Raster,
): SolidFillRegion[] {
  const opts = { ...DEFAULT_MERGE_SOLID_FILL_OPTIONS, ...options };
  return proposals.filter((proposal) => {
    for (const box of existing) {
      const iou = intersectionOverUnion(proposal.box, box);
      const overlap = boxIntersection(proposal.box, box);
      const coverage =
        overlap === null ? 0 : boxArea(overlap) / Math.max(1, boxArea(proposal.box));
      const blocked = iou >= opts.maxIouWithExisting || coverage >= opts.maxCoverageByExisting;
      if (!blocked) continue;

      if (raster !== undefined && proposalBeatsExisting(raster, proposal, box, opts.minChromaAdvantage)) {
        continue;
      }
      return false;
    }
    return true;
  });
}

function proposalBeatsExisting(
  raster: Raster,
  proposal: SolidFillRegion,
  existing: BoundingBox,
  minAdvantage: number,
): boolean {
  const existingFill = dominantFillInBox(raster, existing);
  if (existingFill === undefined) return false;
  return proposal.chroma >= labChroma(existingFill) + minAdvantage;
}

function dominantFillInBox(raster: Raster, box: BoundingBox): Rgb | undefined {
  const counts = new Map<number, { n: number; r: number; g: number; b: number }>();
  const xMin = Math.max(0, Math.floor(box.xMin));
  const yMin = Math.max(0, Math.floor(box.yMin));
  const xMax = Math.min(raster.width, Math.ceil(box.xMax));
  const yMax = Math.min(raster.height, Math.ceil(box.yMax));
  const binSize = DEFAULT_PROPOSE_SOLID_FILL_OPTIONS.binSize;
  for (let y = yMin; y < yMax; y += 1) {
    for (let x = xMin; x < xMax; x += 1) {
      const offset = (y * raster.width + x) * CHANNELS;
      const r = raster.data[offset] as number;
      const g = raster.data[offset + 1] as number;
      const b = raster.data[offset + 2] as number;
      const key = quantizeKey(r, g, b, binSize);
      const existing = counts.get(key);
      if (existing === undefined) counts.set(key, { n: 1, r, g, b });
      else {
        existing.n += 1;
        existing.r += r;
        existing.g += g;
        existing.b += b;
      }
    }
  }
  let best: { n: number; r: number; g: number; b: number } | undefined;
  for (const entry of counts.values()) {
    if (best === undefined || entry.n > best.n) best = entry;
  }
  if (best === undefined) return undefined;
  return createRgb(
    Math.round(best.r / best.n),
    Math.round(best.g / best.n),
    Math.round(best.b / best.n),
  );
}

/**
 * Dominant-bin purity that ignores caption/glyph pixels.
 *
 * White "13" on a blue day (or white label on a red tag) used to tank purity
 * below the solid threshold. Those pixels sit far in luminance from the fill,
 * so they are excluded from the denominator.
 */
function glyphAwarePurity(
  raster: Raster,
  box: BoundingBox,
  binSize: number,
  expectedKey: number,
  fill: Rgb,
  glyphLuminanceGap: number,
): number {
  const fillLum = relativeLuminance(fill);
  let considered = 0;
  let matched = 0;
  const xMin = Math.max(0, Math.floor(box.xMin));
  const yMin = Math.max(0, Math.floor(box.yMin));
  const xMax = Math.min(raster.width, Math.ceil(box.xMax));
  const yMax = Math.min(raster.height, Math.ceil(box.yMax));
  for (let y = yMin; y < yMax; y += 1) {
    for (let x = xMin; x < xMax; x += 1) {
      const offset = (y * raster.width + x) * CHANNELS;
      const color = createRgb(
        raster.data[offset] as number,
        raster.data[offset + 1] as number,
        raster.data[offset + 2] as number,
      );
      const key = quantizeKey(color.r, color.g, color.b, binSize);
      if (key === expectedKey) {
        considered += 1;
        matched += 1;
        continue;
      }
      if (Math.abs(relativeLuminance(color) - fillLum) >= glyphLuminanceGap) {
        // Glyph / icon stroke — ignore.
        continue;
      }
      considered += 1;
    }
  }
  return considered === 0 ? 0 : matched / considered;
}

function meanColorForKey(
  raster: Raster,
  box: BoundingBox,
  binSize: number,
  expectedKey: number,
): Rgb | undefined {
  let n = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  const xMin = Math.max(0, Math.floor(box.xMin));
  const yMin = Math.max(0, Math.floor(box.yMin));
  const xMax = Math.min(raster.width, Math.ceil(box.xMax));
  const yMax = Math.min(raster.height, Math.ceil(box.yMax));
  for (let y = yMin; y < yMax; y += 1) {
    for (let x = xMin; x < xMax; x += 1) {
      const offset = (y * raster.width + x) * CHANNELS;
      const pr = raster.data[offset] as number;
      const pg = raster.data[offset + 1] as number;
      const pb = raster.data[offset + 2] as number;
      if (quantizeKey(pr, pg, pb, binSize) !== expectedKey) continue;
      n += 1;
      r += pr;
      g += pg;
      b += pb;
    }
  }
  if (n === 0) return undefined;
  return createRgb(Math.round(r / n), Math.round(g / n), Math.round(b / n));
}

function nmsRegions(regions: readonly SolidFillRegion[], maxIou: number): SolidFillRegion[] {
  const kept: SolidFillRegion[] = [];
  for (const region of regions) {
    const clash = kept.findIndex((other) => intersectionOverUnion(region.box, other.box) >= maxIou);
    if (clash < 0) {
      kept.push(region);
      continue;
    }
    const other = kept[clash]!;
    // Prefer saturated / purer fill when two solids collide.
    if (regionScore(region) > regionScore(other)) {
      kept[clash] = region;
    }
  }
  return kept;
}

function regionScore(region: SolidFillRegion): number {
  return region.chroma * 10 + region.purity * 100 + Math.log2(1 + region.pixelCount);
}

function quantizeKey(r: number, g: number, b: number, binSize: number): number {
  const qr = (Math.min(255, r) / binSize) | 0;
  const qg = (Math.min(255, g) / binSize) | 0;
  const qb = (Math.min(255, b) / binSize) | 0;
  return (qr << 16) | (qg << 8) | qb;
}

function* neighbors4(
  x: number,
  y: number,
  width: number,
  height: number,
): Generator<[number, number]> {
  if (x > 0) yield [x - 1, y];
  if (x + 1 < width) yield [x + 1, y];
  if (y > 0) yield [x, y - 1];
  if (y + 1 < height) yield [x, y + 1];
}
