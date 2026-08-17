import { compareStrings } from '../numeric.js';
import { normalizeLabel } from '../elements/element.js';

/**
 * A stroke-density band that maps measured ink coverage to a CSS weight.
 *
 * Bands are half-open (`[min, max)`) so consecutive bands tile the 0..1 range
 * without a pixel of ambiguity.
 */
export interface FontWeightBand {
  readonly weight: number;
  readonly minStrokeDensity: number;
  readonly maxStrokeDensity: number;
}

/**
 * Everything the engine needs to know about one font family.
 *
 * `visualToCssRatio` is the ratio between the ink height PaddleOCR measures for a
 * line of capitals/x-height glyphs and the declared CSS `font-size`. It is a fixed
 * constant per family, which is what makes font size recoverable from a flat
 * screenshot; it must be re-calibrated if the project adopts a new family.
 */
export interface FontProfile {
  readonly family: string;
  /** Alternative spellings that a browser's computed style may report. */
  readonly aliases: readonly string[];
  readonly visualToCssRatio: number;
  readonly weightBands: readonly FontWeightBand[];
}

/**
 * Shared density→weight bands used until a face is calibrated on real renders.
 * Hosts should replace these after `calibrate-font-profiles` when weight QA matters.
 */
export const DEFAULT_WEIGHT_BANDS: readonly FontWeightBand[] = [
  { weight: 300, minStrokeDensity: 0, maxStrokeDensity: 0.13 },
  { weight: 400, minStrokeDensity: 0.13, maxStrokeDensity: 0.25 },
  { weight: 500, minStrokeDensity: 0.25, maxStrokeDensity: 0.32 },
  { weight: 600, minStrokeDensity: 0.32, maxStrokeDensity: 0.38 },
  { weight: 700, minStrokeDensity: 0.38, maxStrokeDensity: 1 },
];

/** Builds a profile with default weight bands (ratio still must be calibrated). */
export function fontProfile(
  family: string,
  visualToCssRatio: number,
  aliases: readonly string[] = [],
): FontProfile {
  return {
    family,
    aliases,
    visualToCssRatio,
    weightBands: DEFAULT_WEIGHT_BANDS,
  };
}

export const MARK_PRO_PROFILE: FontProfile = fontProfile('Mark Pro', 0.82, [
  'MarkPro',
  'Mark Pro Regular',
  'FF Mark Pro',
]);

export const OPEN_SANS_PROFILE: FontProfile = fontProfile('Open Sans', 0.85, [
  'OpenSans',
  'Open Sans Regular',
]);

export const DEFAULT_FONT_PROFILES: readonly FontProfile[] = [MARK_PRO_PROFILE, OPEN_SANS_PROFILE];

export class FontRegistry {
  private readonly byKey = new Map<string, FontProfile>();
  private readonly profileList: readonly FontProfile[];

  constructor(profiles: readonly FontProfile[] = DEFAULT_FONT_PROFILES) {
    if (profiles.length === 0) {
      throw new RangeError('FontRegistry requires at least one font profile');
    }
    for (const profile of profiles) {
      assertProfile(profile);
      for (const name of [profile.family, ...profile.aliases]) {
        const key = normalizeLabel(name);
        const existing = this.byKey.get(key);
        if (existing !== undefined && existing.family !== profile.family) {
          throw new Error(
            `Font name "${name}" is claimed by both "${existing.family}" and "${profile.family}"`,
          );
        }
        this.byKey.set(key, profile);
      }
    }
    this.profileList = [...profiles].sort((a, b) => compareStrings(a.family, b.family));
  }

  get profiles(): readonly FontProfile[] {
    return this.profileList;
  }

  /** Looks up one family name (not a stack). Returns undefined when unknown. */
  find(family: string): FontProfile | undefined {
    return this.byKey.get(normalizeLabel(stripQuotes(family)));
  }

  get(family: string): FontProfile {
    const profile = this.find(family);
    if (profile === undefined) {
      const known = this.profileList.map((item) => item.family).join(', ');
      throw new Error(`Unknown font family "${family}". Known families: ${known}`);
    }
    return profile;
  }

  /**
   * Resolves the first known family in a CSS font stack such as
   * `"Mark Pro", "Helvetica Neue", sans-serif`.
   */
  resolveStack(fontFamilyStack: string): FontProfile | undefined {
    for (const candidate of parseFontStack(fontFamilyStack)) {
      const profile = this.find(candidate);
      if (profile !== undefined) return profile;
    }
    return undefined;
  }
}

export function parseFontStack(fontFamilyStack: string): readonly string[] {
  return fontFamilyStack
    .split(',')
    .map((part) => stripQuotes(part.trim()))
    .filter((part) => part.length > 0);
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

function assertProfile(profile: FontProfile): void {
  if (profile.family.trim().length === 0) {
    throw new RangeError('FontProfile.family must not be empty');
  }
  if (!(profile.visualToCssRatio > 0 && profile.visualToCssRatio <= 2)) {
    throw new RangeError(
      `FontProfile.visualToCssRatio for "${profile.family}" must be within (0, 2], received ${profile.visualToCssRatio}`,
    );
  }
  if (profile.weightBands.length === 0) {
    throw new RangeError(`FontProfile "${profile.family}" must define at least one weight band`);
  }
  const bands = [...profile.weightBands].sort((a, b) => a.minStrokeDensity - b.minStrokeDensity);
  for (const band of bands) {
    if (band.minStrokeDensity >= band.maxStrokeDensity) {
      throw new RangeError(
        `Weight band ${band.weight} of "${profile.family}" must satisfy min < max`,
      );
    }
  }
  for (let index = 1; index < bands.length; index += 1) {
    const previous = bands[index - 1] as FontWeightBand;
    const current = bands[index] as FontWeightBand;
    if (current.minStrokeDensity !== previous.maxStrokeDensity) {
      throw new RangeError(
        `Weight bands of "${profile.family}" must tile without gaps or overlaps: ` +
          `${previous.weight} ends at ${previous.maxStrokeDensity} but ${current.weight} starts at ${current.minStrokeDensity}`,
      );
    }
  }
}
