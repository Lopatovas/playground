import type { FontProfile } from './font-profile.js';
import { roundHalfAwayFromZero, roundTo } from '../numeric.js';

/**
 * Recovers the declared CSS `font-size` from the ink height measured in the design
 * raster.
 *
 * `Target_CSS_Font_Size = round(Visual_Height_Pixels / Ratio)`
 *
 * `pixelRatio` accounts for design exports at a higher density than the live
 * viewport: a 2x Figma export renders 24px type as 48px of ink, so the measured
 * height is divided by the export's device pixel ratio first.
 */
export function deriveCssFontSize(
  visualHeightPx: number,
  profile: FontProfile,
  pixelRatio = 1,
): number {
  if (!(visualHeightPx > 0)) {
    throw new RangeError(
      `deriveCssFontSize() requires visualHeightPx > 0, received ${visualHeightPx}`,
    );
  }
  if (!(pixelRatio > 0)) {
    throw new RangeError(`deriveCssFontSize() requires pixelRatio > 0, received ${pixelRatio}`);
  }
  return roundHalfAwayFromZero(visualHeightPx / pixelRatio / profile.visualToCssRatio);
}

/** Inverse of {@link deriveCssFontSize}, useful for diagnostics and tests. */
export function expectedVisualHeight(
  cssFontSizePx: number,
  profile: FontProfile,
  pixelRatio = 1,
): number {
  if (!(cssFontSizePx > 0)) {
    throw new RangeError(
      `expectedVisualHeight() requires cssFontSizePx > 0, received ${cssFontSizePx}`,
    );
  }
  return roundTo(cssFontSizePx * profile.visualToCssRatio * pixelRatio, 4);
}

/**
 * Maps measured stroke density (share of ink pixels inside the glyph box) to a CSS
 * weight using the family's calibrated bands.
 */
export function classifyFontWeight(strokeDensity: number, profile: FontProfile): number {
  if (!(strokeDensity >= 0 && strokeDensity <= 1)) {
    throw new RangeError(
      `classifyFontWeight() requires strokeDensity within [0, 1], received ${strokeDensity}`,
    );
  }
  const bands = [...profile.weightBands].sort((a, b) => a.minStrokeDensity - b.minStrokeDensity);
  for (const band of bands) {
    if (strokeDensity >= band.minStrokeDensity && strokeDensity < band.maxStrokeDensity) {
      return band.weight;
    }
  }
  // Density exactly at the top of the last band.
  return (bands[bands.length - 1] as { weight: number }).weight;
}

export interface FontFamilyCandidateScore {
  readonly family: string;
  /** Structural similarity against the design crop, in [-1, 1]. */
  readonly score: number;
}

export interface FontFamilySelection {
  readonly family: string;
  readonly score: number;
  readonly runnerUpFamily: string | null;
  readonly runnerUpScore: number | null;
  /** Winner's lead over the runner-up. */
  readonly margin: number;
  /**
   * False when the two candidates scored too closely to call, in which case the
   * pipeline reports no family defect rather than guessing.
   */
  readonly confident: boolean;
}

/**
 * Picks the font family whose rendered reference best matches the design crop.
 *
 * When the top two scores are within `minMargin` the selection is marked
 * unconfident: at small sizes Open Sans and Mark Pro render nearly identically, and
 * a coin-flip defect report is worse than none.
 */
export function selectFontFamily(
  scores: readonly FontFamilyCandidateScore[],
  minMargin = 0.02,
): FontFamilySelection {
  if (scores.length === 0) {
    throw new RangeError('selectFontFamily() requires at least one candidate score');
  }
  if (minMargin < 0) {
    throw new RangeError('selectFontFamily() requires a non-negative minMargin');
  }

  const ranked = [...scores].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.family < b.family ? -1 : a.family > b.family ? 1 : 0;
  });

  const winner = ranked[0] as FontFamilyCandidateScore;
  const runnerUp = ranked.length > 1 ? (ranked[1] as FontFamilyCandidateScore) : null;
  const margin =
    runnerUp === null ? Number.POSITIVE_INFINITY : roundTo(winner.score - runnerUp.score, 6);

  return {
    family: winner.family,
    score: roundTo(winner.score, 6),
    runnerUpFamily: runnerUp?.family ?? null,
    runnerUpScore: runnerUp === null ? null : roundTo(runnerUp.score, 6),
    margin: runnerUp === null ? 1 : margin,
    confident: runnerUp === null || margin >= minMargin,
  };
}
