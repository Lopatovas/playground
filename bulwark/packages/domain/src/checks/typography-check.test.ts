import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
  checkTypography,
  typographyDefects,
} from './typography-check.js';
import type { TextMeasurement } from './typography-check.js';
import { FontRegistry } from '../typography/font-profile.js';
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
      tolerancePx: 1,
      fontFamily: 'Mark Pro',
      visualToCssRatio: 0.82,
      designElementId: 'cta-label',
    });
    expect(result.sizeDefects[0]?.message).toContain('should render at 24px');
    expect(result.sizeDefects[0]?.message).toContain('browser reports 18px');
  });

  it('tolerates a one-pixel rounding difference', () => {
    const result = checkTypography([
      measurement({ live: { fontFamilyStack: 'Mark Pro', fontSizePx: 25, fontWeight: 400 } }),
    ]);
    expect(result.sizeDefects).toHaveLength(0);
    expect(result.findings[0]?.fontSizeDeltaPx).toBe(1);
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

  it('scales ink measured from a 2x design export back to CSS pixels', () => {
    const result = checkTypography([measurement({ visualHeightPx: 39.36 })], new FontRegistry(), {
      ...DEFAULT_TYPOGRAPHY_CHECK_OPTIONS,
      designPixelRatio: 2,
    });
    expect(result.findings[0]?.expectedCssFontSizePx).toBe(24);
    expect(result.sizeDefects).toHaveLength(0);
  });

  it('flags a bold design rendered at regular weight', () => {
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

  it('flags an unregistered live stack instead of skipping size/weight', () => {
    const result = checkTypography([
      measurement({
        familyScores: [],
        visualHeightPx: 10.2, // ~12px Open Sans
        strokeDensity: 0.42,
        live: {
          fontFamilyStack: 'Georgia, "Times New Roman", serif',
          fontSizePx: 16,
          fontWeight: 400,
        },
      }),
    ]);

    expect(result.skipped).toHaveLength(0);
    expect(result.findings).toHaveLength(1);
    expect(result.familyDefects).toHaveLength(1);
    expect(result.familyDefects[0]?.actualFamily).toContain('Georgia');
    expect(result.sizeDefects.length + result.weightDefects.length).toBeGreaterThan(0);
  });

  it('skips only when the registry itself has no usable ratio', () => {
    // Empty registry can't be constructed; an empty-score Comic Sans pick with a
    // registry that doesn't include that family still falls back to Open Sans.
    const result = checkTypography([
      measurement({
        familyScores: [{ family: 'Comic Sans MS', score: 0.99 }],
        live: { fontFamilyStack: 'Comic Sans MS, cursive', fontSizePx: 24, fontWeight: 400 },
      }),
    ]);

    expect(result.skipped).toHaveLength(0);
    expect(result.familyDefects[0]?.type).toBe('font-family');
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
});
