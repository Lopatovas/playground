import type { ColorCluster, Rgb } from '@bulwark/domain';
import { createRgb, createSeededRandom, hashStringToSeed, roundTo, sortClustersByDominance, toHex } from '@bulwark/domain';
import type { Raster } from './raster.js';
import { CHANNELS } from './raster.js';

export interface KMeansOptions {
  /** Number of color pools. The blueprint's four is enough for text on a fill. */
  readonly k: number;
  readonly maxIterations: number;
  /** Stop once no centroid moves further than this in RGB space. */
  readonly tolerance: number;
  /**
   * Cap on sampled pixels. Above it, pixels are taken on a fixed stride, which
   * keeps large crops fast without making the result depend on chance.
   */
  readonly maxSamples: number;
  /** Seed for centroid initialisation, so the same crop always clusters the same way. */
  readonly seed: number;
}

export const DEFAULT_KMEANS_OPTIONS: KMeansOptions = {
  k: 4,
  maxIterations: 64,
  tolerance: 0.5,
  maxSamples: 20000,
  seed: hashStringToSeed('bulwark/kmeans'),
};

export interface KMeansResult {
  /** Pools sorted by pixel count, largest first. */
  readonly clusters: readonly ColorCluster[];
  readonly iterations: number;
  readonly converged: boolean;
  readonly sampledPixelCount: number;
}

/**
 * Clusters a crop's pixels into color pools with k-means.
 *
 * Sampling a single pixel cannot work — the center of a button is as likely to land
 * on a glyph stroke, a border or an anti-aliased edge as on the fill — so the fill
 * has to be recovered as the dominant pool of the whole crop.
 *
 * Initialisation is k-means++ driven by a seeded PRNG rather than the platform RNG:
 * k-means only converges to a local optimum, so an unseeded run could legitimately
 * return different pools for identical input and make a report unreproducible.
 */
export function clusterColors(raster: Raster, options: Partial<KMeansOptions> = {}): KMeansResult {
  const config: KMeansOptions = { ...DEFAULT_KMEANS_OPTIONS, ...options };
  assertOptions(config);

  const samples = samplePixels(raster, config.maxSamples);
  const sampleCount = samples.length / 3;
  if (sampleCount === 0) {
    throw new RangeError('clusterColors() requires at least one pixel');
  }

  const effectiveK = Math.min(config.k, countDistinctColors(samples));
  const centroids = initializeCentroids(samples, sampleCount, effectiveK, config.seed);
  const assignments = new Int32Array(sampleCount).fill(-1);

  let iterations = 0;
  let converged = false;

  while (iterations < config.maxIterations) {
    iterations += 1;

    let changed = false;
    for (let index = 0; index < sampleCount; index += 1) {
      const nearest = nearestCentroid(samples, index, centroids, effectiveK);
      if (assignments[index] !== nearest) {
        assignments[index] = nearest;
        changed = true;
      }
    }

    const sums = new Float64Array(effectiveK * 3);
    const counts = new Uint32Array(effectiveK);
    for (let index = 0; index < sampleCount; index += 1) {
      const cluster = assignments[index] as number;
      counts[cluster] = (counts[cluster] as number) + 1;
      sums[cluster * 3] = (sums[cluster * 3] as number) + (samples[index * 3] as number);
      sums[cluster * 3 + 1] = (sums[cluster * 3 + 1] as number) + (samples[index * 3 + 1] as number);
      sums[cluster * 3 + 2] = (sums[cluster * 3 + 2] as number) + (samples[index * 3 + 2] as number);
    }

    let maxShift = 0;
    for (let cluster = 0; cluster < effectiveK; cluster += 1) {
      const count = counts[cluster] as number;
      if (count === 0) continue; // Empty pool keeps its position; no random restart.
      for (let channel = 0; channel < 3; channel += 1) {
        const next = (sums[cluster * 3 + channel] as number) / count;
        const shift = Math.abs(next - (centroids[cluster * 3 + channel] as number));
        if (shift > maxShift) maxShift = shift;
        centroids[cluster * 3 + channel] = next;
      }
    }

    if (!changed || maxShift <= config.tolerance) {
      converged = true;
      break;
    }
  }

  const counts = new Uint32Array(effectiveK);
  for (let index = 0; index < sampleCount; index += 1) {
    const cluster = assignments[index] as number;
    counts[cluster] = (counts[cluster] as number) + 1;
  }

  const clusters: ColorCluster[] = [];
  for (let cluster = 0; cluster < effectiveK; cluster += 1) {
    const pixelCount = counts[cluster] as number;
    if (pixelCount === 0) continue;
    clusters.push({
      color: createRgb(
        centroids[cluster * 3] as number,
        centroids[cluster * 3 + 1] as number,
        centroids[cluster * 3 + 2] as number,
      ),
      pixelCount,
      share: roundTo(pixelCount / sampleCount, 6),
    });
  }

  return {
    clusters: mergeIdenticalColors(sortClustersByDominance(clusters), sampleCount),
    iterations,
    converged,
    sampledPixelCount: sampleCount,
  };
}

/** Flat `[r, g, b, r, g, b, ...]` samples taken on a deterministic stride. */
function samplePixels(raster: Raster, maxSamples: number): Float64Array {
  const totalPixels = raster.width * raster.height;
  const stride = Math.max(1, Math.ceil(totalPixels / maxSamples));
  const sampleCount = Math.ceil(totalPixels / stride);
  const samples = new Float64Array(sampleCount * 3);

  let cursor = 0;
  for (let pixel = 0; pixel < totalPixels; pixel += stride) {
    const offset = pixel * CHANNELS;
    samples[cursor * 3] = raster.data[offset] as number;
    samples[cursor * 3 + 1] = raster.data[offset + 1] as number;
    samples[cursor * 3 + 2] = raster.data[offset + 2] as number;
    cursor += 1;
  }
  return samples.subarray(0, cursor * 3) as Float64Array;
}

function countDistinctColors(samples: Float64Array): number {
  const seen = new Set<number>();
  for (let index = 0; index < samples.length; index += 3) {
    const key =
      ((samples[index] as number) << 16) |
      ((samples[index + 1] as number) << 8) |
      (samples[index + 2] as number);
    seen.add(key);
    if (seen.size > 256) break;
  }
  return seen.size;
}

/** k-means++ seeding: spread the initial centroids by squared distance. */
function initializeCentroids(
  samples: Float64Array,
  sampleCount: number,
  k: number,
  seed: number,
): Float64Array {
  const random = createSeededRandom(seed);
  const centroids = new Float64Array(k * 3);

  const firstIndex = Math.min(sampleCount - 1, Math.floor(random() * sampleCount));
  centroids[0] = samples[firstIndex * 3] as number;
  centroids[1] = samples[firstIndex * 3 + 1] as number;
  centroids[2] = samples[firstIndex * 3 + 2] as number;

  const distances = new Float64Array(sampleCount).fill(Number.POSITIVE_INFINITY);

  for (let cluster = 1; cluster < k; cluster += 1) {
    let total = 0;
    for (let index = 0; index < sampleCount; index += 1) {
      const distance = squaredDistance(samples, index, centroids, cluster - 1);
      if (distance < (distances[index] as number)) distances[index] = distance;
      total += distances[index] as number;
    }

    let target = random() * total;
    let chosen = sampleCount - 1;
    for (let index = 0; index < sampleCount; index += 1) {
      target -= distances[index] as number;
      if (target <= 0) {
        chosen = index;
        break;
      }
    }

    centroids[cluster * 3] = samples[chosen * 3] as number;
    centroids[cluster * 3 + 1] = samples[chosen * 3 + 1] as number;
    centroids[cluster * 3 + 2] = samples[chosen * 3 + 2] as number;
  }

  return centroids;
}

function nearestCentroid(
  samples: Float64Array,
  sampleIndex: number,
  centroids: Float64Array,
  k: number,
): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let cluster = 0; cluster < k; cluster += 1) {
    const distance = squaredDistance(samples, sampleIndex, centroids, cluster);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = cluster;
    }
  }
  return best;
}

function squaredDistance(
  samples: Float64Array,
  sampleIndex: number,
  centroids: Float64Array,
  cluster: number,
): number {
  const dr = (samples[sampleIndex * 3] as number) - (centroids[cluster * 3] as number);
  const dg = (samples[sampleIndex * 3 + 1] as number) - (centroids[cluster * 3 + 1] as number);
  const db = (samples[sampleIndex * 3 + 2] as number) - (centroids[cluster * 3 + 2] as number);
  return dr * dr + dg * dg + db * db;
}

/**
 * Two centroids can round to the same 8-bit color; merging them keeps role
 * assignment from treating one flat fill as two competing pools.
 */
function mergeIdenticalColors(
  clusters: readonly ColorCluster[],
  sampleCount: number,
): readonly ColorCluster[] {
  const byHex = new Map<string, { color: Rgb; pixelCount: number }>();
  for (const cluster of clusters) {
    const hex = toHex(cluster.color);
    const existing = byHex.get(hex);
    if (existing === undefined) {
      byHex.set(hex, { color: cluster.color, pixelCount: cluster.pixelCount });
    } else {
      existing.pixelCount += cluster.pixelCount;
    }
  }

  return sortClustersByDominance(
    [...byHex.values()].map((entry) => ({
      color: entry.color,
      pixelCount: entry.pixelCount,
      share: roundTo(entry.pixelCount / sampleCount, 6),
    })),
  );
}

function assertOptions(options: KMeansOptions): void {
  if (!Number.isInteger(options.k) || options.k < 1 || options.k > 16) {
    throw new RangeError(`clusterColors() requires an integer k within 1..16, received ${options.k}`);
  }
  if (!Number.isInteger(options.maxIterations) || options.maxIterations < 1) {
    throw new RangeError('clusterColors() requires maxIterations >= 1');
  }
  if (options.tolerance < 0) {
    throw new RangeError('clusterColors() requires a non-negative tolerance');
  }
  if (!Number.isInteger(options.maxSamples) || options.maxSamples < options.k) {
    throw new RangeError('clusterColors() requires maxSamples >= k');
  }
}
