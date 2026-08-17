/**
 * Numeric helpers shared by every measurement in the engine.
 *
 * Every function here is total and deterministic: the same inputs always produce
 * bit-identical outputs, which is what lets the pipeline emit a byte-stable report.
 */

export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError(`clamp() requires min <= max, received min=${min} max=${max}`);
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Rounds half away from zero, unlike `Math.round` which rounds half towards
 * `+Infinity` and therefore treats -0.5 and 0.5 asymmetrically.
 */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Rounds to a fixed number of decimals, returning a number (not a string). */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) {
    throw new RangeError(`roundTo() supports 0..12 decimals, received ${decimals}`);
  }
  const factor = 10 ** decimals;
  const scaled = roundHalfAwayFromZero(value * factor) / factor;
  // Normalises -0 to 0 so serialized reports never differ by sign of zero.
  return scaled === 0 ? 0 : scaled;
}

export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('mean() requires at least one value');
  }
  let total = 0;
  for (const value of values) total += value;
  return total / values.length;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('median() requires at least one value');
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  if (sorted.length % 2 === 1) {
    return sorted[middle] as number;
  }
  return ((sorted[middle - 1] as number) + (sorted[middle] as number)) / 2;
}

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

/**
 * Deterministic 32-bit PRNG (mulberry32). Used wherever an algorithm needs
 * pseudo-randomness (k-means seeding); seeding it from stable input keeps runs
 * reproducible.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a over a string, used to derive stable seeds from stable identifiers. */
export function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Lexicographic comparison with a fixed, locale-independent ordering. */
export function compareStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
