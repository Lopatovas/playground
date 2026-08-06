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
    const result = checkColors([
      measurement({ liveBackground: parseColor('#2564ec') }),
    ]);
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
  });

  it('can restrict the check to backgrounds', () => {
    const result = checkColors([measurement({ liveForeground: parseColor('#9ca3af') })], {
      ...DEFAULT_COLOR_CHECK_OPTIONS,
      checkForeground: false,
    });
    expect(result.defects).toHaveLength(0);
    expect(result.comparisons).toHaveLength(1);
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
    expect(() =>
      checkColors([], { ...DEFAULT_COLOR_CHECK_OPTIONS, deltaEThreshold: -1 }),
    ).toThrow(RangeError);
  });
});
