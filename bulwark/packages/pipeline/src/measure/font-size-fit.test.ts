import { describe, expect, it } from 'vitest';
import { fitCssFontSize } from './font-size-fit.js';

describe('fitCssFontSize', () => {
  it('recovers the size with the highest score near the seed', async () => {
    const truth = 14;
    const result = await fitCssFontSize({
      seedPx: 12,
      livePx: 20,
      radiusPx: 8,
      liveSlack: 0.02,
      scoreAt: async (size) => 1 - Math.abs(size - truth) * 0.05,
    });
    expect(result.cssFontSizePx).toBe(14);
    expect(result.confident).toBe(true);
    expect(result.preferredLive).toBe(false);
    expect(result.evaluations).toBeGreaterThan(3);
  });

  it('prefers live when it nearly matches the best score', async () => {
    const result = await fitCssFontSize({
      seedPx: 12,
      livePx: 13,
      liveSlack: 0.08,
      // 18 is slightly best, but 13 is within slack → prefer live
      scoreAt: async (size) => (size === 18 ? 0.42 : size === 13 ? 0.38 : 0.2),
    });
    expect(result.cssFontSizePx).toBe(13);
    expect(result.preferredLive).toBe(true);
    expect(result.confident).toBe(true);
  });

  it('marks a flat score landscape as unconfident', async () => {
    const result = await fitCssFontSize({
      seedPx: 16,
      livePx: 20,
      liveSlack: 0.01,
      minMargin: 0.05,
      scoreAt: async () => 0.5,
    });
    expect(result.confident).toBe(false);
  });

  it('rejects weak absolute scores', async () => {
    const result = await fitCssFontSize({
      seedPx: 20,
      livePx: 24,
      liveSlack: 0.01,
      minScore: 0.8,
      scoreAt: async (size) => 0.4 - Math.abs(size - 20) * 0.01,
    });
    expect(result.cssFontSizePx).toBe(20);
    expect(result.confident).toBe(false);
  });

  it('uses scoreMany for the coarse sweep when provided', async () => {
    const batched: number[] = [];
    const result = await fitCssFontSize({
      seedPx: 16,
      livePx: 16,
      scoreAt: async (size) => 1 - Math.abs(size - 16) * 0.1,
      scoreMany: async (sizes) => {
        batched.push(...sizes);
        return new Map(sizes.map((size) => [size, 1 - Math.abs(size - 16) * 0.1]));
      },
    });
    expect(result.cssFontSizePx).toBe(16);
    expect(batched.length).toBeGreaterThan(3);
  });
});
