import { describe, expect, it } from 'vitest';
import {
  FontRegistry,
  MARK_PRO_PROFILE,
  OPEN_SANS_PROFILE,
  parseFontStack,
} from './font-profile.js';

describe('parseFontStack', () => {
  it('splits and unquotes a CSS font stack', () => {
    expect(parseFontStack('"Mark Pro", \'Helvetica Neue\', sans-serif')).toEqual([
      'Mark Pro',
      'Helvetica Neue',
      'sans-serif',
    ]);
  });

  it('drops empty entries', () => {
    expect(parseFontStack('Open Sans,,  , sans-serif')).toEqual(['Open Sans', 'sans-serif']);
  });
});

describe('FontRegistry', () => {
  const registry = new FontRegistry();

  it('resolves a family by name, alias and casing', () => {
    expect(registry.get('Mark Pro').visualToCssRatio).toBe(0.82);
    expect(registry.get('markpro').family).toBe('Mark Pro');
    expect(registry.get('OPEN SANS').visualToCssRatio).toBe(0.85);
  });

  it('resolves the first known family in a stack', () => {
    expect(registry.resolveStack('"Mark Pro", sans-serif')?.family).toBe('Mark Pro');
    expect(registry.resolveStack('Inter, "Open Sans", sans-serif')?.family).toBe('Open Sans');
    expect(registry.resolveStack('Inter, system-ui')).toBeUndefined();
  });

  it('throws a helpful error for an unknown family', () => {
    expect(() => registry.get('Comic Sans')).toThrow(/Known families: Mark Pro, Open Sans/);
  });

  it('exposes profiles in a stable order', () => {
    expect(registry.profiles.map((profile) => profile.family)).toEqual(['Mark Pro', 'Open Sans']);
  });

  it('accepts a project-specific profile set', () => {
    const custom = new FontRegistry([
      {
        family: 'Inter',
        aliases: [],
        visualToCssRatio: 0.727,
        weightBands: [{ weight: 400, minStrokeDensity: 0, maxStrokeDensity: 1 }],
      },
    ]);
    expect(custom.get('Inter').visualToCssRatio).toBe(0.727);
    expect(custom.find('Mark Pro')).toBeUndefined();
  });

  it('rejects an empty registry', () => {
    expect(() => new FontRegistry([])).toThrow(RangeError);
  });

  it('rejects a name claimed by two families', () => {
    expect(
      () =>
        new FontRegistry([
          MARK_PRO_PROFILE,
          { ...OPEN_SANS_PROFILE, aliases: ['MarkPro'] },
        ]),
    ).toThrow(/claimed by both/);
  });

  it('rejects an out-of-range visual ratio', () => {
    expect(() => new FontRegistry([{ ...MARK_PRO_PROFILE, visualToCssRatio: 0 }])).toThrow(RangeError);
    expect(() => new FontRegistry([{ ...MARK_PRO_PROFILE, visualToCssRatio: 3 }])).toThrow(RangeError);
  });

  it('rejects weight bands with a gap or an overlap', () => {
    expect(
      () =>
        new FontRegistry([
          {
            ...MARK_PRO_PROFILE,
            weightBands: [
              { weight: 400, minStrokeDensity: 0, maxStrokeDensity: 0.2 },
              { weight: 700, minStrokeDensity: 0.3, maxStrokeDensity: 1 },
            ],
          },
        ]),
    ).toThrow(/tile without gaps or overlaps/);

    expect(
      () =>
        new FontRegistry([
          {
            ...MARK_PRO_PROFILE,
            weightBands: [
              { weight: 400, minStrokeDensity: 0, maxStrokeDensity: 0.4 },
              { weight: 700, minStrokeDensity: 0.3, maxStrokeDensity: 1 },
            ],
          },
        ]),
    ).toThrow(/tile without gaps or overlaps/);
  });

  it('rejects an inverted band', () => {
    expect(
      () =>
        new FontRegistry([
          {
            ...MARK_PRO_PROFILE,
            weightBands: [{ weight: 400, minStrokeDensity: 0.5, maxStrokeDensity: 0.2 }],
          },
        ]),
    ).toThrow(/min < max/);
  });
});
