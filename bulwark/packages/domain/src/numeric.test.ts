import { describe, expect, it } from 'vitest';
import {
  clamp,
  compareStrings,
  createSeededRandom,
  hashStringToSeed,
  mean,
  median,
  roundHalfAwayFromZero,
  roundTo,
  sum,
} from './numeric.js';

describe('clamp', () => {
  it('bounds a value to the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('rejects an inverted range', () => {
    expect(() => clamp(1, 10, 0)).toThrow(RangeError);
  });
});

describe('roundHalfAwayFromZero', () => {
  it('rounds halves away from zero symmetrically', () => {
    expect(roundHalfAwayFromZero(0.5)).toBe(1);
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });

  it('matches Math.round away from halves', () => {
    for (const value of [0.4, 1.6, -0.4, -1.6, 12.3]) {
      expect(roundHalfAwayFromZero(value)).toBe(Math.sign(value) * Math.round(Math.abs(value)));
    }
  });
});

describe('roundTo', () => {
  it('rounds to the requested decimals', () => {
    expect(roundTo(1.23456, 2)).toBe(1.23);
    expect(roundTo(1.23556, 3)).toBe(1.236);
    expect(roundTo(24.499999, 0)).toBe(24);
  });

  it('normalises negative zero so serialized output is stable', () => {
    expect(roundTo(-0.0001, 2)).toBe(0);
    expect(Object.is(roundTo(-0.0001, 2), -0)).toBe(false);
  });

  it('rejects unsupported precision', () => {
    expect(() => roundTo(1, -1)).toThrow(RangeError);
    expect(() => roundTo(1, 13)).toThrow(RangeError);
    expect(() => roundTo(1, 1.5)).toThrow(RangeError);
  });
});

describe('aggregates', () => {
  it('computes mean, median and sum', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(sum([])).toBe(0);
    expect(sum([1, 2, 3])).toBe(6);
  });

  it('rejects empty input where undefined has no meaning', () => {
    expect(() => mean([])).toThrow(RangeError);
    expect(() => median([])).toThrow(RangeError);
  });

  it('does not mutate its input', () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });
});

describe('createSeededRandom', () => {
  it('produces the same stream for the same seed', () => {
    const first = createSeededRandom(42);
    const second = createSeededRandom(42);
    const a = [first(), first(), first()];
    const b = [second(), second(), second()];
    expect(a).toEqual(b);
  });

  it('produces a different stream for a different seed', () => {
    const first = createSeededRandom(1);
    const second = createSeededRandom(2);
    expect(first()).not.toBe(second());
  });

  it('stays inside [0, 1)', () => {
    const next = createSeededRandom(7);
    for (let index = 0; index < 1000; index += 1) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('hashStringToSeed', () => {
  it('is stable and distinguishes inputs', () => {
    expect(hashStringToSeed('design.png')).toBe(hashStringToSeed('design.png'));
    expect(hashStringToSeed('design.png')).not.toBe(hashStringToSeed('live.png'));
  });

  it('returns an unsigned 32-bit integer', () => {
    const seed = hashStringToSeed('bulwark');
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });
});

describe('compareStrings', () => {
  it('sorts by code unit, independent of locale', () => {
    const sorted = ['b', 'A', 'a', 'B'].sort(compareStrings);
    expect(sorted).toEqual(['A', 'B', 'a', 'b']);
  });
});
