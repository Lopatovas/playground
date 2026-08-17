/**
 * Fit a CSS font-size by rendering the known string in a known family and
 * scoring each candidate against the design glyph box (width/height).
 *
 * Seed with an ink/ratio estimate, sweep a window, then refine. When the live
 * size scores nearly as well as the best candidate, prefer live (design matches
 * implementation). Falls back to "unconfident" when the best score is weak.
 */

export interface FontSizeFitOptions {
  /** Ink/ratio estimate — centers the search window. */
  readonly seedPx: number;
  /** Always evaluated; often the true answer when design matches live. */
  readonly livePx: number;
  readonly scoreAt: (sizePx: number) => Promise<number>;
  /**
   * Optional batch scorer — used for the coarse sweep to cut Playwright round-trips.
   * Missing sizes are filled via `scoreAt`.
   */
  readonly scoreMany?: (sizesPx: readonly number[]) => Promise<ReadonlyMap<number, number>>;
  readonly minSizePx?: number;
  readonly maxSizePx?: number;
  /** Half-width of the coarse search window around the seed. */
  readonly radiusPx?: number;
  /** Minimum match score to trust the fit. */
  readonly minScore?: number;
  /** Best must beat the runner-up size by at least this much. */
  readonly minMargin?: number;
  /**
   * If score(live) >= bestScore − liveSlack, treat live as the design size
   * (kills “fit drifted to a nearby size” false positives).
   */
  readonly liveSlack?: number;
}

export interface FontSizeFitResult {
  readonly cssFontSizePx: number;
  readonly score: number;
  readonly runnerUpScore: number | null;
  readonly confident: boolean;
  readonly evaluations: number;
  /** True when live was preferred because it nearly matched the best score. */
  readonly preferredLive: boolean;
}

export async function fitCssFontSize(options: FontSizeFitOptions): Promise<FontSizeFitResult> {
  const minSize = options.minSizePx ?? 8;
  const maxSize = options.maxSizePx ?? 96;
  const radius = options.radiusPx ?? 12;
  const minScore = options.minScore ?? 0.35;
  const minMargin = options.minMargin ?? 0.01;
  const liveSlack = options.liveSlack ?? 0.08;

  const seed = clamp(Math.round(options.seedPx), minSize, maxSize);
  const live = clamp(Math.round(options.livePx), minSize, maxSize);
  const lo = clamp(seed - radius, minSize, maxSize);
  const hi = clamp(seed + radius, minSize, maxSize);

  const cache = new Map<number, number>();
  const scoreAt = async (sizePx: number): Promise<number> => {
    const cached = cache.get(sizePx);
    if (cached !== undefined) return cached;
    const score = await options.scoreAt(sizePx);
    cache.set(sizePx, score);
    return score;
  };

  // Coarse sweep (2px steps) + live + seed.
  const coarse = new Set<number>();
  for (let size = lo; size <= hi; size += 2) coarse.add(size);
  coarse.add(seed);
  coarse.add(live);
  if (lo % 2 !== seed % 2) coarse.add(lo);
  if (hi % 2 !== seed % 2) coarse.add(hi);

  const coarseList = [...coarse].sort((a, b) => a - b);
  if (options.scoreMany !== undefined) {
    const batch = await options.scoreMany(coarseList);
    for (const [size, score] of batch) cache.set(size, score);
  }
  for (const size of coarseList) {
    await scoreAt(size);
  }

  let bestSize = seed;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const size of coarseList) {
    const score = cache.get(size) ?? Number.NEGATIVE_INFINITY;
    if (score > bestScore || (score === bestScore && size === live)) {
      bestScore = score;
      bestSize = size;
    }
  }

  // Fine refine around the coarse winner.
  const fine = [bestSize - 1, bestSize + 1].filter((size) => size >= minSize && size <= maxSize);
  if (options.scoreMany !== undefined && fine.length > 0) {
    const batch = await options.scoreMany(fine);
    for (const [size, score] of batch) cache.set(size, score);
  }
  for (const size of fine) {
    const score = await scoreAt(size);
    if (score > bestScore || (score === bestScore && size === live)) {
      bestScore = score;
      bestSize = size;
    }
  }

  const liveScore = await scoreAt(live);
  let preferredLive = false;
  // Only override a *different* winner when live is nearly as good — kills
  // “fit drifted to a nearby size” FPs without marking flat landscapes confident.
  if (bestSize !== live && liveScore >= bestScore - liveSlack) {
    bestSize = live;
    bestScore = liveScore;
    preferredLive = true;
  }

  let runnerUp: number | null = null;
  for (const [size, score] of cache.entries()) {
    if (size === bestSize) continue;
    if (runnerUp === null || score > runnerUp) runnerUp = score;
  }

  const margin = runnerUp === null ? 0 : bestScore - runnerUp;
  const confident = preferredLive
    ? bestScore >= minScore
    : bestScore >= minScore && margin >= minMargin;

  return {
    cssFontSizePx: bestSize,
    score: bestScore,
    runnerUpScore: runnerUp,
    confident,
    evaluations: cache.size,
    preferredLive,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
