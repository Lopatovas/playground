import { describe, expect, it } from 'vitest';
import { DEFAULT_COLOR_CHECK_OPTIONS, checkColors, colorDefects } from './color-check.js';
import type { ColorMeasurement } from './color-check.js';
import { createBox } from '../geometry/box.js';
import { parseColor } from '../color/rgb.js';

function measurement(overrides: Partial<ColorMeasurement> = {}): ColorMeasurement {
  return {
    designElementId: 'cta',
    liveElementId: 'cta',
    designBox: createBox(40, 160, 200, 208),
    liveBox: createBox(40, 160, 200, 208),
    label: 'primary button',
    designBackground: parseColor('#2563eb'),
    liveBackground: parseColor('#2563eb'),
    designForeground: parseColor('#ffffff'),
    liveForeground: parseColor('#ffffff'),
    ...overrides,
  };
}

describe('checkColors', () => {
  it('passes an exact match', () => {
    const result = checkColors([measurement()]);
    expect(colorDefects(result)).toHaveLength(0);
    expect(result.comparisons.map((comparison) => comparison.role)).toEqual([
      'background',
      'foreground',
    ]);
    expect(result.comparisons.every((comparison) => comparison.deltaE2000 === 0)).toBe(true);
  });

  it('absorbs gamma-level channel noise instead of reporting it', () => {
    const result = checkColors([measurement({ liveBackground: parseColor('#2564ec') })]);
    expect(result.defects).toHaveLength(0);
    expect(result.comparisons[0]?.deltaE2000).toBeLessThan(2);
    expect(result.comparisons[0]?.withinTolerance).toBe(true);
  });

  it('flags a visibly wrong shade', () => {
    const result = checkColors([measurement({ liveBackground: parseColor('#3b82f6') })]);

    expect(result.defects).toHaveLength(1);
    expect(result.defects[0]).toMatchObject({
      type: 'color',
      severity: 'error',
      role: 'background',
      expectedHex: '#2563eb',
      actualHex: '#3b82f6',
      threshold: 2,
    });
    expect(result.defects[0]?.deltaE2000).toBeGreaterThan(2);
    expect(result.defects[0]?.message).toContain('ΔE2000');
  });

  it('flags a wrong text color independently of the background', () => {
    const result = checkColors([measurement({ liveForeground: parseColor('#9ca3af') })]);
    expect(result.defects).toHaveLength(1);
    expect(result.defects[0]).toMatchObject({ role: 'foreground', id: 'color:foreground:cta' });
    // Near-neutral gray uses the stricter neutral ink threshold.
    expect(result.defects[0]?.threshold).toBe(DEFAULT_COLOR_CHECK_OPTIONS.inkNeutralDeltaEThreshold);
  });

  it('uses a looser chromatic ink threshold for accent colors', () => {
    const result = checkColors(
      [
        measurement({
          designForeground: parseColor('#ffe566'),
          liveForeground: parseColor('#fff1a8'),
          compareRoles: ['foreground'],
        }),
      ],
      {
        ...DEFAULT_COLOR_CHECK_OPTIONS,
        inkDeltaEThreshold: 8,
        inkNeutralDeltaEThreshold: 13,
        inkAccentChroma: 20,
      },
    );
    expect(result.defects).toHaveLength(1);
    expect(result.defects[0]?.threshold).toBe(8);
  });

  it('uses the ink threshold for foreground comparisons', () => {
    // Small ΔE that exceeds fill threshold (2) but not ink threshold (10).
    const result = checkColors([measurement({ liveForeground: parseColor('#f0f0f0') })], {
      ...DEFAULT_COLOR_CHECK_OPTIONS,
      deltaEThreshold: 2,
      inkDeltaEThreshold: 10,
      inkNeutralDeltaEThreshold: 10,
    });
    expect(result.defects.filter((defect) => defect.role === 'foreground')).toHaveLength(0);
  });

  it('can restrict the check to backgrounds', () => {
    const result = checkColors([measurement({ liveForeground: parseColor('#9ca3af') })], {
      ...DEFAULT_COLOR_CHECK_OPTIONS,
      checkForeground: false,
    });
    expect(result.defects).toHaveLength(0);
    expect(result.comparisons).toHaveLength(1);
  });

  it('honours per-measurement compareRoles from specialized strategies', () => {
    const result = checkColors([
      measurement({
        compareRoles: ['background'],
        liveForeground: parseColor('#9ca3af'),
      }),
    ]);
    expect(result.defects).toHaveLength(0);
    expect(result.comparisons).toHaveLength(1);
    expect(result.comparisons[0]?.role).toBe('background');
  });

  it('skips the foreground when a crop had no distinct ink color', () => {
    const result = checkColors([
      measurement({ designForeground: undefined, liveForeground: undefined }),
    ]);
    expect(result.comparisons).toHaveLength(1);
    expect(result.comparisons[0]?.role).toBe('background');
  });

  it('honours a stricter threshold', () => {
    const result = checkColors([measurement({ liveBackground: parseColor('#2564ec') })], {
      ...DEFAULT_COLOR_CHECK_OPTIONS,
      deltaEThreshold: 0.1,
    });
    expect(result.defects).toHaveLength(1);
  });

  it('rejects a negative threshold', () => {
    expect(() => checkColors([], { ...DEFAULT_COLOR_CHECK_OPTIONS, deltaEThreshold: -1 })).toThrow(
      RangeError,
    );
  });

  it('matches series palette stops and flags drifted hues', () => {
    const result = checkColors(
      [
        measurement({
          compareRoles: ['series'],
          designSeries: [parseColor('#2563eb'), parseColor('#22c55e'), parseColor('#f59e0b')],
          liveSeries: [parseColor('#2563eb'), parseColor('#16a34a'), parseColor('#f59e0b')],
        }),
      ],
      { ...DEFAULT_COLOR_CHECK_OPTIONS, seriesDeltaEThreshold: 8 },
    );
    expect(result.comparisons).toHaveLength(3);
    expect(result.comparisons.every((c) => c.role === 'series')).toBe(true);
    expect(result.defects).toHaveLength(1);
    expect(result.defects[0]).toMatchObject({
      role: 'series',
      expectedHex: '#22c55e',
      actualHex: '#16a34a',
    });
  });

  it('passes matching series palettes', () => {
    const palette = [parseColor('#2563eb'), parseColor('#22c55e')];
    const result = checkColors([
      measurement({
        compareRoles: ['series'],
        designSeries: palette,
        liveSeries: palette,
      }),
    ]);
    expect(result.defects).toHaveLength(0);
    expect(result.comparisons).toHaveLength(2);
  });

  it('dedupes identical shade reports down to one defect', () => {
    const result = checkColors([
      measurement({
        designElementId: 'a',
        liveElementId: 'a',
        liveBackground: parseColor('#3b82f6'),
        compareRoles: ['background'],
      }),
      measurement({
        designElementId: 'b',
        liveElementId: 'b',
        label: 'bar',
        liveBackground: parseColor('#3b82f6'),
        compareRoles: ['background'],
      }),
    ]);
    expect(result.defects).toHaveLength(1);
    expect(result.comparisons).toHaveLength(2);
  });
});
