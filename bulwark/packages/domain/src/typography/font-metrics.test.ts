import { describe, expect, it } from 'vitest';
import {
  classifyFontWeight,
  deriveCssFontSize,
  expectedVisualHeight,
  selectFontFamily,
} from './font-metrics.js';
import { MARK_PRO_PROFILE, OPEN_SANS_PROFILE } from './font-profile.js';

describe('deriveCssFontSize', () => {
  it('recovers the blueprint example: 24px of ink is 24px type in Mark Pro terms', () => {
    // 19.68px of ink / 0.82 = 24px CSS.
    expect(deriveCssFontSize(19.68, MARK_PRO_PROFILE)).toBe(24);
  });

  it('recovers Open Sans sizes from its own ratio', () => {
    expect(deriveCssFontSize(13.6, OPEN_SANS_PROFILE)).toBe(16);
    expect(deriveCssFontSize(27.2, OPEN_SANS_PROFILE)).toBe(32);
  });

  it('rounds to the nearest whole pixel', () => {
    expect(deriveCssFontSize(13.9, OPEN_SANS_PROFILE)).toBe(16);
    expect(deriveCssFontSize(14.5, OPEN_SANS_PROFILE)).toBe(17);
  });

  it('divides out the density of a 2x design export', () => {
    expect(deriveCssFontSize(39.36, MARK_PRO_PROFILE, 2)).toBe(24);
    expect(deriveCssFontSize(27.2, OPEN_SANS_PROFILE, 2)).toBe(16);
  });

  it('round-trips against expectedVisualHeight', () => {
    for (const size of [12, 14, 16, 18, 24, 32, 48]) {
      for (const profile of [MARK_PRO_PROFILE, OPEN_SANS_PROFILE]) {
        expect(deriveCssFontSize(expectedVisualHeight(size, profile), profile)).toBe(size);
      }
    }
  });

  it('round-trips at a 2x export density', () => {
    for (const size of [12, 16, 24, 40]) {
      const ink = expectedVisualHeight(size, MARK_PRO_PROFILE, 2);
      expect(deriveCssFontSize(ink, MARK_PRO_PROFILE, 2)).toBe(size);
    }
  });

  it('rejects impossible measurements', () => {
    expect(() => deriveCssFontSize(0, MARK_PRO_PROFILE)).toThrow(RangeError);
    expect(() => deriveCssFontSize(-5, MARK_PRO_PROFILE)).toThrow(RangeError);
    expect(() => deriveCssFontSize(20, MARK_PRO_PROFILE, 0)).toThrow(RangeError);
    expect(() => expectedVisualHeight(0, MARK_PRO_PROFILE)).toThrow(RangeError);
  });
});

describe('classifyFontWeight', () => {
  it('reads the blueprint density bands', () => {
    expect(classifyFontWeight(0.18, MARK_PRO_PROFILE)).toBe(400);
    expect(classifyFontWeight(0.42, MARK_PRO_PROFILE)).toBe(700);
  });

  it('uses half-open bands so a boundary belongs to exactly one weight', () => {
    expect(classifyFontWeight(0.13, MARK_PRO_PROFILE)).toBe(400);
    expect(classifyFontWeight(0.1299, MARK_PRO_PROFILE)).toBe(300);
    expect(classifyFontWeight(0.25, MARK_PRO_PROFILE)).toBe(500);
    expect(classifyFontWeight(0.38, MARK_PRO_PROFILE)).toBe(700);
  });

  it('clamps the extremes into the outer bands', () => {
    expect(classifyFontWeight(0, MARK_PRO_PROFILE)).toBe(300);
    expect(classifyFontWeight(1, MARK_PRO_PROFILE)).toBe(700);
  });

  it('rejects a density outside [0, 1]', () => {
    expect(() => classifyFontWeight(-0.1, MARK_PRO_PROFILE)).toThrow(RangeError);
    expect(() => classifyFontWeight(1.2, MARK_PRO_PROFILE)).toThrow(RangeError);
  });
});

describe('selectFontFamily', () => {
  it('picks the highest-scoring reference render', () => {
    const selection = selectFontFamily([
      { family: 'Open Sans', score: 0.71 },
      { family: 'Mark Pro', score: 0.93 },
    ]);

    expect(selection.family).toBe('Mark Pro');
    expect(selection.score).toBe(0.93);
    expect(selection.runnerUpFamily).toBe('Open Sans');
    expect(selection.margin).toBeCloseTo(0.22, 6);
    expect(selection.confident).toBe(true);
  });

  it('refuses to call a near-tie', () => {
    const selection = selectFontFamily([
      { family: 'Open Sans', score: 0.902 },
      { family: 'Mark Pro', score: 0.9 },
    ]);

    expect(selection.family).toBe('Open Sans');
    expect(selection.confident).toBe(false);
  });

  it('honours a custom margin', () => {
    const scores = [
      { family: 'Open Sans', score: 0.902 },
      { family: 'Mark Pro', score: 0.9 },
    ];
    expect(selectFontFamily(scores, 0.001).confident).toBe(true);
  });

  it('is confident with a single candidate', () => {
    const selection = selectFontFamily([{ family: 'Mark Pro', score: 0.8 }]);
    expect(selection).toMatchObject({
      family: 'Mark Pro',
      runnerUpFamily: null,
      runnerUpScore: null,
      margin: 1,
      confident: true,
    });
  });

  it('breaks exact score ties by family name rather than input order', () => {
    const forward = selectFontFamily([
      { family: 'Open Sans', score: 0.5 },
      { family: 'Mark Pro', score: 0.5 },
    ]);
    const reversed = selectFontFamily([
      { family: 'Mark Pro', score: 0.5 },
      { family: 'Open Sans', score: 0.5 },
    ]);
    expect(forward.family).toBe('Mark Pro');
    expect(reversed.family).toBe('Mark Pro');
    expect(forward.confident).toBe(false);
  });

  it('rejects empty input and a negative margin', () => {
    expect(() => selectFontFamily([])).toThrow(RangeError);
    expect(() => selectFontFamily([{ family: 'Mark Pro', score: 1 }], -1)).toThrow(RangeError);
  });
});
