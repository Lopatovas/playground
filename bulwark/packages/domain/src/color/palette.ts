import type { Rgb } from './rgb.js';
import { toHex } from './rgb.js';
import { deltaE2000 } from './delta-e.js';
import { rgbToLab } from './lab.js';
import { compareStrings, roundTo } from '../numeric.js';

/** One color pool produced by clustering a cropped component. */
export interface ColorCluster {
  readonly color: Rgb;
  readonly pixelCount: number;
  /** Share of the crop's pixels in this cluster, in [0, 1]. */
  readonly share: number;
}

export interface PaletteRoleOptions {
  /**
   * A cluster smaller than this share is treated as anti-aliasing noise and is
   * never chosen as the foreground.
   */
  readonly minForegroundShare: number;
  /**
   * Minimum perceptual distance from the background before a cluster counts as a
   * distinct foreground rather than a shade of the background.
   */
  readonly minForegroundDeltaE: number;
}

export const DEFAULT_PALETTE_ROLE_OPTIONS: PaletteRoleOptions = {
  minForegroundShare: 0.01,
  minForegroundDeltaE: 5,
};

export interface PaletteRoles {
  /** Dominant pool: the component's structural background. */
  readonly background: ColorCluster;
  /** Solid ink color, or null when the crop has no distinct foreground. */
  readonly foreground: ColorCluster | null;
  /** Pools rejected as anti-aliasing or background shades, largest first. */
  readonly ignored: readonly ColorCluster[];
}

/**
 * Assigns background and foreground roles to a set of color clusters.
 *
 * The background is simply the dominant pool. The foreground is the remaining pool
 * that is perceptually furthest from the background, not the smallest one:
 * anti-aliased edge pixels blend background and ink, so they land *between* the two
 * in Lab space and are frequently the smallest pools in the crop. Picking by
 * distance lands on the solid glyph color; picking by size lands on a blur band.
 */
export function assignPaletteRoles(
  clusters: readonly ColorCluster[],
  options: PaletteRoleOptions = DEFAULT_PALETTE_ROLE_OPTIONS,
): PaletteRoles {
  if (clusters.length === 0) {
    throw new RangeError('assignPaletteRoles() requires at least one cluster');
  }
  if (options.minForegroundShare < 0 || options.minForegroundShare > 1) {
    throw new RangeError('assignPaletteRoles() requires minForegroundShare within [0, 1]');
  }

  const sorted = sortClustersByDominance(clusters);
  const background = sorted[0] as ColorCluster;
  const backgroundLab = rgbToLab(background.color);

  const candidates = sorted.slice(1).map((cluster) => ({
    cluster,
    deltaE: roundTo(deltaE2000(backgroundLab, rgbToLab(cluster.color)), 4),
  }));

  const eligible = candidates.filter(
    (candidate) =>
      candidate.cluster.share >= options.minForegroundShare &&
      candidate.deltaE >= options.minForegroundDeltaE,
  );

  eligible.sort((a, b) => {
    if (b.deltaE !== a.deltaE) return b.deltaE - a.deltaE;
    if (a.cluster.share !== b.cluster.share) return a.cluster.share - b.cluster.share;
    return compareStrings(toHex(a.cluster.color), toHex(b.cluster.color));
  });

  const foreground =
    eligible.length > 0 ? (eligible[0] as { cluster: ColorCluster }).cluster : null;
  const ignored = sorted.slice(1).filter((cluster) => cluster !== foreground);

  return { background, foreground, ignored };
}

/** Sorts clusters largest-first, breaking ties by hex so output never wobbles. */
export function sortClustersByDominance(
  clusters: readonly ColorCluster[],
): readonly ColorCluster[] {
  return [...clusters].sort((a, b) => {
    if (b.pixelCount !== a.pixelCount) return b.pixelCount - a.pixelCount;
    return compareStrings(toHex(a.color), toHex(b.color));
  });
}
