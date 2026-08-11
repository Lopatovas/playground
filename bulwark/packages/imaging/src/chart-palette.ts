import type { ColorCluster, Rgb } from '@bulwark/domain';
import { createRgb, deltaE2000Rgb, labChroma, roundTo, toHex } from '@bulwark/domain';
import { clusterColors } from './kmeans.js';
import type { Raster } from './raster.js';
import { CHANNELS } from './raster.js';

export interface ExtractSeriesPaletteOptions {
  /** k-means pool count before dropping junk. */
  readonly clusterCount: number;
  /** Drop pools smaller than this share of the crop. */
  readonly minShare: number;
  /** Drop near-neutral pools (axes, paper, AA). */
  readonly minChroma: number;
  /** Drop pools too close to estimated paper/background. */
  readonly minDeltaEFromPaper: number;
  /** Max series stops kept after filtering. */
  readonly maxStops: number;
}

export const DEFAULT_SERIES_PALETTE_OPTIONS: ExtractSeriesPaletteOptions = {
  clusterCount: 6,
  minShare: 0.04,
  minChroma: 12,
  minDeltaEFromPaper: 8,
  maxStops: 6,
};

/**
 * Recovers the chromatic series colors in a chart crop (pie, donut, mixed bars).
 *
 * k-means → drop tiny / gray / paper-like pools → remaining stops are the palette.
 * Deterministic via seeded clustering.
 */
export function extractSeriesPalette(
  raster: Raster,
  options: Partial<ExtractSeriesPaletteOptions> = {},
): readonly Rgb[] {
  const opts = { ...DEFAULT_SERIES_PALETTE_OPTIONS, ...options };
  if (raster.width * raster.height === 0) return [];

  const clustered = clusterColors(raster, { k: opts.clusterCount });
  const paper = estimatePaperColor(raster, clustered.clusters);
  const kept: { color: Rgb; share: number; chroma: number }[] = [];

  for (const cluster of clustered.clusters) {
    if (cluster.share < opts.minShare) continue;
    const chroma = labChroma(cluster.color);
    if (chroma < opts.minChroma) continue;
    if (deltaE2000Rgb(paper, cluster.color) < opts.minDeltaEFromPaper) continue;
    kept.push({ color: cluster.color, share: cluster.share, chroma });
  }

  kept.sort((a, b) => {
    if (b.share !== a.share) return b.share - a.share;
    if (b.chroma !== a.chroma) return b.chroma - a.chroma;
    return toHex(a.color).localeCompare(toHex(b.color));
  });

  return kept.slice(0, opts.maxStops).map((entry) => entry.color);
}

/**
 * Paper/hole color for a chart: prefer the dominant cluster when it is low-chroma
 * (card background), else the mode of the crop border ring.
 */
function estimatePaperColor(raster: Raster, clusters: readonly ColorCluster[]): Rgb {
  const dominant = clusters[0];
  if (dominant !== undefined && labChroma(dominant.color) < 18) {
    return dominant.color;
  }
  return borderModeColor(raster) ?? dominant?.color ?? createRgb(255, 255, 255);
}

function borderModeColor(raster: Raster): Rgb | undefined {
  const { width, height, data } = raster;
  if (width < 2 || height < 2) return undefined;
  const counts = new Map<string, { n: number; r: number; g: number; b: number }>();
  const bump = (r: number, g: number, b: number) => {
    const key = `${r >> 4},${g >> 4},${b >> 4}`;
    const existing = counts.get(key);
    if (existing === undefined) counts.set(key, { n: 1, r, g, b });
    else {
      existing.n += 1;
      existing.r += r;
      existing.g += g;
      existing.b += b;
    }
  };
  for (let x = 0; x < width; x += 1) {
    const top = x * CHANNELS;
    const bottom = ((height - 1) * width + x) * CHANNELS;
    bump(data[top] as number, data[top + 1] as number, data[top + 2] as number);
    bump(data[bottom] as number, data[bottom + 1] as number, data[bottom + 2] as number);
  }
  for (let y = 1; y < height - 1; y += 1) {
    const left = (y * width) * CHANNELS;
    const right = (y * width + width - 1) * CHANNELS;
    bump(data[left] as number, data[left + 1] as number, data[left + 2] as number);
    bump(data[right] as number, data[right + 1] as number, data[right + 2] as number);
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

export interface SeriesMatch {
  readonly design: Rgb;
  readonly live: Rgb;
  readonly deltaE2000: number;
}

/**
 * Greedy 1:1 matching of design series stops to live stops in Lab ΔE space.
 */
export function matchSeriesPalettes(
  design: readonly Rgb[],
  live: readonly Rgb[],
): readonly SeriesMatch[] {
  const usedLive = new Set<number>();
  const matches: SeriesMatch[] = [];
  for (const designColor of design) {
    let bestIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let index = 0; index < live.length; index += 1) {
      if (usedLive.has(index)) continue;
      const delta = deltaE2000Rgb(designColor, live[index]!);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = index;
      }
    }
    if (bestIndex < 0) continue;
    usedLive.add(bestIndex);
    matches.push({
      design: designColor,
      live: live[bestIndex]!,
      deltaE2000: roundTo(bestDelta, 4),
    });
  }
  return matches;
}
