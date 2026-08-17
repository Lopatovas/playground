import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
  checkTypography,
  shouldEmitWeightDefect,
  typographyDefects,
} from './typography-check.js';
import type { TextMeasurement } from './typography-check.js';
import { FontRegistry, OPEN_SANS_PROFILE } from '../typography/font-profile.js';
import { createBox } from '../geometry/box.js';

function measurement(overrides: Partial<TextMeasurement> = {}): TextMeasurement {
  return {
    designElementId: 'cta-label',
    liveElementId: 'cta-label',
    designBox: createBox(40, 160, 200, 190),
    liveBox: createBox(40, 160, 200, 190),
    text: 'Get Started',
    visualHeightPx: 19.68,
    strokeDensity: 0.18,
    familyScores: [
      { family: 'Mark Pro', score: 0.94 },
      { family: 'Open Sans', score: 0.71 },
    ],
    live: { fontFamilyStack: '"Mark Pro", sans-serif', fontSizePx: 24, fontWeight: 400 },
    ...overrides,
  };
}

describe('checkTypography', () => {
  it('passes a faithful implementation', () => {
    const result = checkTypography([measurement()]);

    expect(typographyDefects(result)).toHaveLength(0);
    expect(result.findings[0]).toMatchObject({
      expectedFamily: 'Mark Pro',
      expectedCssFontSizePx: 24,
      actualCssFontSizePx: 24,
      fontSizeDeltaPx: 0,
      expectedFontWeight: 400,
      actualFontWeight: 400,
      visualToCssRatio: 0.82,
    });
  });

  it('flags the blueprint scenario: 24px of derived type rendered at 18px', () => {
    const result = checkTypography([
      measurement({ live: { fontFamilyStack: 'Mark Pro', fontSizePx: 18, fontWeight: 400 } }),
    ]);

    expect(result.sizeDefects).toHaveLength(1);
    expect(result.sizeDefects[0]).toMatchObject({
      type: 'font-size',
      severity: 'error',
      expectedCssPx: 24,
      actualCssPx: 18,
      deltaPx: -6,
      tolerancePx: 3,
      fontFamily: 'Mark Pro',
      visualToCssRatio: 0.82,
      designElementId: 'cta-label',
    });
    expect(result.sizeDefects[0]?.message).toContain('should render at 24px');
    expect(result.sizeDefects[0]?.message).toContain('browser reports 18px');
  });

  it('tolerates up to three pixels of ink/CSS disagreement', () => {
    const result = checkTypography([
      measurement({ live: { fontFamilyStack: 'Mark Pro', fontSizePx: 27, fontWeight: 400 } }),
    ]);
    expect(result.sizeDefects).toHaveLength(0);
    expect(result.findings[0]?.fontSizeDeltaPx).toBe(3);
  });

  it('flags a four-pixel size drift', () => {
    const result = checkTypography([
      measurement({ live: { fontFamilyStack: 'Mark Pro', fontSizePx: 28, fontWeight: 400 } }),
    ]);
    expect(result.sizeDefects).toHaveLength(1);
    expect(result.sizeDefects[0]?.deltaPx).toBe(4);
  });

  it("uses the live family's ratio even when SSIM prefers another face", () => {
    const result = checkTypography([
      measurement({
        visualHeightPx: 17,
        familyScores: [
          { family: 'Open Sans', score: 0.95 },
          { family: 'Mark Pro', score: 0.6 },
        ],
        live: { fontFamilyStack: '"Mark Pro", sans-serif', fontSizePx: 21, fontWeight: 400 },
      }),
    ]);

    // 17 / 0.82 Mark Pro ≈ 21; Open Sans 0.85 would have yielded 20.
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(21);
    expect(result.findings[0]?.visualToCssRatio).toBe(0.82);
    expect(result.findings[0]?.expectedFamily).toBe('Open Sans');
    expect(result.familyDefects).toHaveLength(1);
  });

  it('uses the family-specific ratio, so the same ink height implies different sizes', () => {
    const markPro = checkTypography([measurement({ visualHeightPx: 17 })]);
    const openSans = checkTypography([
      measurement({
        visualHeightPx: 17,
        familyScores: [
          { family: 'Open Sans', score: 0.95 },
          { family: 'Mark Pro', score: 0.6 },
        ],
        live: { fontFamilyStack: '"Open Sans", sans-serif', fontSizePx: 20, fontWeight: 400 },
      }),
    ]);

    expect(markPro.findings[0]?.expectedCssFontSizePx).toBe(21);
    expect(openSans.findings[0]?.expectedCssFontSizePx).toBe(20);
  });

  it('suppresses small size deltas when the design crop is ink-poor', () => {
    const result = checkTypography([
      measurement({
        // Tall box, short ink → fill ~0.23; |Δ|=4 needs fill ≥ 0.45.
        designBox: createBox(40, 160, 200, 190),
        visualHeightPx: 7,
        live: { fontFamilyStack: 'Mark Pro', fontSizePx: 13, fontWeight: 400 },
      }),
    ]);
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(9);
    expect(result.findings[0]?.fontSizeDeltaPx).toBe(4);
    expect(result.findings[0]?.inkSizeReliable).toBe(false);
    expect(result.sizeDefects).toHaveLength(0);
    expect(result.unreliableSize).toHaveLength(1);
    expect(result.unreliableSize[0]?.reason).toMatch(/fills/i);
  });

  it('still flags seed-scale size drops on moderately padded line boxes', () => {
    const result = checkTypography([
      measurement({
        // ink 18 → expected 22; live 14 → |Δ|=8; fill = 18/40 = 0.45 ≥ large-delta floor 0.35.
        designBox: createBox(40, 160, 200, 200),
        visualHeightPx: 18,
        live: { fontFamilyStack: 'Mark Pro', fontSizePx: 14, fontWeight: 400 },
      }),
    ]);
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(22);
    expect(result.findings[0]?.fontSizeDeltaPx).toBe(-8);
    expect(result.findings[0]?.inkSizeReliable).toBe(true);
    expect(result.sizeDefects).toHaveLength(1);
  });

  it('scales ink measured from a 2x design export back to CSS pixels', () => {
    const result = checkTypography([measurement({ visualHeightPx: 39.36 })], new FontRegistry(), {
      ...DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
      designPixelRatio: 2,
    });
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(24);
    expect(result.sizeDefects).toHaveLength(0);
  });

  it('flags a bold design rendered at regular weight (large weight gap)', () => {
    const result = checkTypography([measurement({ strokeDensity: 0.41 })]);

    expect(result.weightDefects).toHaveLength(1);
    expect(result.weightDefects[0]).toMatchObject({
      type: 'font-weight',
      severity: 'warning',
      expectedWeight: 700,
      actualWeight: 400,
      strokeDensity: 0.41,
    });
    expect(result.weightDefects[0]?.message).toContain('41% ink coverage');
  });

  it('ignores Δ200 weight gaps as density noise', () => {
    const result = checkTypography([
      measurement({
        strokeDensity: 0.33, // classifies as 600
        live: { fontFamilyStack: 'Mark Pro', fontSizePx: 24, fontWeight: 400 },
      }),
    ]);
    expect(result.findings[0]?.expectedFontWeight).toBe(600);
    expect(result.weightDefects).toHaveLength(0);
  });

  it('ignores one-notch weight jitter inside the live band margin', () => {
    // Density classifies as 700 (>=0.38) but sits near the 600/700 edge; live is 600.
    const result = checkTypography([
      measurement({
        strokeDensity: 0.39,
        live: { fontFamilyStack: 'Mark Pro', fontSizePx: 24, fontWeight: 600 },
      }),
    ]);
    expect(result.findings[0]?.expectedFontWeight).toBe(700);
    expect(result.weightDefects).toHaveLength(0);
  });

  it('flags the wrong family when the reference render is a clear winner', () => {
    const result = checkTypography([
      measurement({
        familyScores: [
          { family: 'Open Sans', score: 0.95 },
          { family: 'Mark Pro', score: 0.62 },
        ],
        visualHeightPx: 20.4,
        live: { fontFamilyStack: '"Mark Pro", sans-serif', fontSizePx: 24, fontWeight: 400 },
      }),
    ]);

    expect(result.familyDefects).toHaveLength(1);
    expect(result.familyDefects[0]).toMatchObject({
      type: 'font-family',
      severity: 'warning',
      expectedFamily: 'Open Sans',
      actualFamily: 'Mark Pro',
      expectedFamilyScore: 0.95,
      actualFamilyScore: 0.62,
    });
  });

  it('stays silent when the two reference renders score too closely', () => {
    const result = checkTypography([
      measurement({
        familyScores: [
          { family: 'Open Sans', score: 0.9 },
          { family: 'Mark Pro', score: 0.895 },
        ],
      }),
    ]);

    expect(result.familyDefects).toHaveLength(0);
    expect(result.findings[0]?.expectedFamilyConfident).toBe(false);
    // Falls back to the live family's ratio rather than guessing a family.
    expect(result.findings[0]?.expectedFamily).toBe('Mark Pro');
  });

  it('can disable the statistical checks and keep the exact one', () => {
    const result = checkTypography(
      [
        measurement({
          strokeDensity: 0.41,
          familyScores: [
            { family: 'Open Sans', score: 0.95 },
            { family: 'Mark Pro', score: 0.62 },
          ],
        }),
      ],
      new FontRegistry(),
      {
        ...DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
        checkFontWeight: false,
        checkFontFamily: false,
      },
    );

    expect(result.weightDefects).toHaveLength(0);
    expect(result.familyDefects).toHaveLength(0);
  });

  it('flags an undeclared live stack using a declared profile for size/weight', () => {
    const result = checkTypography([
      measurement({
        familyScores: [],
        visualHeightPx: 10.2,
        strokeDensity: 0.42,
        live: {
          fontFamilyStack: 'Georgia, "Times New Roman", serif',
          fontSizePx: 16,
          fontWeight: 400,
        },
      }),
    ]);

    expect(result.undeclaredStacks.some((s) => s.includes('Georgia'))).toBe(true);
    expect(result.familyDefects).toHaveLength(1);
    expect(result.familyDefects[0]?.actualFamily).toContain('Georgia');
    expect(result.familyDefects[0]?.message).toContain('undeclared font stack');
    // Size/weight still run against a declared profile (Open Sans first alphabetically
    // among defaults when Mark Pro wins the name sort — registry sorts by family).
    expect(result.findings.length).toBe(1);
    expect(result.sizeDefects.length + result.weightDefects.length).toBeGreaterThan(0);
  });

  it('lists undeclared stacks once when many nodes share the same wrong face', () => {
    const stack = 'Georgia, "Times New Roman", serif';
    const result = checkTypography([
      measurement({
        designElementId: 'a',
        liveElementId: 'a',
        familyScores: [],
        live: { fontFamilyStack: stack, fontSizePx: 16, fontWeight: 400 },
      }),
      measurement({
        designElementId: 'b',
        liveElementId: 'b',
        text: 'Other',
        familyScores: [],
        live: { fontFamilyStack: stack, fontSizePx: 16, fontWeight: 400 },
      }),
    ]);
    expect(result.undeclaredStacks).toEqual([stack]);
    expect(result.familyDefects).toHaveLength(1);
  });

  it('skips size/weight when the SSIM winner is not in the host registry and live is unknown', () => {
    const emptyish = new FontRegistry([OPEN_SANS_PROFILE]);
    const result = checkTypography(
      [
        measurement({
          familyScores: [{ family: 'Comic Sans MS', score: 0.99 }],
          live: { fontFamilyStack: 'Comic Sans MS, cursive', fontSizePx: 24, fontWeight: 400 },
        }),
      ],
      emptyish,
    );

    // Live undeclared → falls back to Open Sans profile in registry for size/weight + family
    expect(result.undeclaredStacks.length).toBe(1);
    expect(result.familyDefects[0]?.type).toBe('font-family');
    expect(result.findings[0]?.expectedFamily).toBe('Open Sans');
  });

  it('measures against the live family when no reference renders were provided', () => {
    const result = checkTypography([measurement({ familyScores: [] })]);
    expect(result.findings[0]?.expectedFamily).toBe('Mark Pro');
    expect(result.familyDefects).toHaveLength(0);
  });

  it('rejects invalid options', () => {
    expect(() =>
      checkTypography([], new FontRegistry(), {
        ...DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
        fontSizeTolerancePx: -1,
      }),
    ).toThrow(RangeError);
    expect(() =>
      checkTypography([], new FontRegistry(), {
        ...DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
        designPixelRatio: 0,
      }),
    ).toThrow(RangeError);
  });

  it('prefers a confident render-fit size over ink÷ratio', () => {
    const result = checkTypography([
      measurement({
        sizeFit: { cssFontSizePx: 18, score: 0.72, confident: true, method: 'render-fit' },
        live: { fontFamilyStack: '"Mark Pro", sans-serif', fontSizePx: 24, fontWeight: 400 },
      }),
    ]);
    expect(result.findings[0]?.sizeEstimateMethod).toBe('render-fit');
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(18);
    expect(result.sizeDefects).toHaveLength(1);
    expect(result.sizeDefects[0]?.message).toContain('render-fit');
  });

  it('ignores an unconfident render-fit and keeps ink÷ratio', () => {
    const result = checkTypography([
      measurement({
        sizeFit: { cssFontSizePx: 30, score: 0.2, confident: false, method: 'render-fit' },
      }),
    ]);
    expect(result.findings[0]?.sizeEstimateMethod).toBe('ink-ratio');
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(24);
    expect(result.sizeDefects).toHaveLength(0);
  });
});

describe('shouldEmitWeightDefect', () => {
  it('suppresses gaps below the configured minimum and keeps large gaps', () => {
    expect(
      shouldEmitWeightDefect(0.39, 700, 600, OPEN_SANS_PROFILE, {
        weightBandMargin: 0.04,
        minWeightGap: 300,
      }),
    ).toBe(false);
    expect(
      shouldEmitWeightDefect(0.33, 600, 400, OPEN_SANS_PROFILE, {
        weightBandMargin: 0.04,
        minWeightGap: 300,
      }),
    ).toBe(false);
    expect(
      shouldEmitWeightDefect(0.41, 700, 400, OPEN_SANS_PROFILE, {
        weightBandMargin: 0.04,
        minWeightGap: 300,
      }),
    ).toBe(true);
  });
});
