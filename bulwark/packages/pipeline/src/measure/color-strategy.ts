import type { ColorRole, ElementKind, Rgb } from '@bulwark/domain';
import { labChroma, normalizeLabel } from '@bulwark/domain';

/**
 * Specialized color extraction path for one matched element.
 *
 * - `fill`: solid-fill background via k-means dominant pool (buttons, badges, solid tiles)
 * - `ink`: border-BG + farthest-mode glyph color (headings, links, tabs, prices)
 * - `palette`: multi-stop series colors (pie, donut, mixed charts)
 * - `fill+ink`: reserved for future button font+fill
 * - `skip`: photos, chrome — no reliable color signal
 */
export type ColorStrategy = 'fill' | 'ink' | 'palette' | 'fill+ink' | 'skip';

const INK_LABELS = new Set([
  'text',
  'heading',
  'link',
  'code snippet',
  'breadcrumb',
  'tab',
  'rating indicator',
]);

const FILL_PLUS_INK_LABELS = new Set(['button', 'utility button']);

const FILL_LABELS = new Set([
  'badge',
  'progress bar',
  'checkbox',
  'radiobox',
  'switch',
  'toggles',
  'solidfill',
  'solid fill',
]);

const PALETTE_LABELS = new Set(['chart']);

/** Media/chrome — skipped unless a solid-fill / palette escape hatch applies. */
const SKIP_LABELS = new Set([
  'logo',
  'avatar',
  'video',
  'carousel',
  'app icon',
  'file icon',
  'text input',
  'search field',
  'search bar',
  'select',
  'table',
  'screen',
  'window',
  'side bar',
  'navigation bar',
  'status bar',
  'toolbar',
  'scroll',
  'list',
]);

export interface ColorStrategyOptions {
  /** Dominant-cluster share required before a fill check is trusted. */
  readonly minSolidShare: number;
  /**
   * Solid `Image` / `SolidFill` boxes (flat KPI tiles, color chips) above this share
   * are fill-checked. Photos/gradients stay below and remain skipped.
   */
  readonly minSolidImageShare: number;
  /**
   * Below {@link minSolidImageShare} but at/above this share, Image crops are treated
   * as multi-stop charts and run through the palette path (pies, donuts).
   */
  readonly minPaletteShare: number;
  /**
   * Lab chroma for a Text crop's dominant fill before we treat it as a colored
   * pill/day (fill) instead of body copy (ink).
   */
  readonly solidTextMinChroma: number;
}

export const DEFAULT_COLOR_STRATEGY_OPTIONS: ColorStrategyOptions = {
  minSolidShare: 0.45,
  minSolidImageShare: 0.72,
  minPaletteShare: 0.18,
  solidTextMinChroma: 20,
};

/**
 * Picks which color checker to run from detector label + fill solidity.
 */
export function classifyColorStrategy(
  label: string,
  kind: ElementKind,
  backgroundShare: number,
  options: Partial<ColorStrategyOptions> = {},
  background?: Rgb,
): ColorStrategy {
  const opts = { ...DEFAULT_COLOR_STRATEGY_OPTIONS, ...options };
  const normalized = normalizeLabel(label);

  if (PALETTE_LABELS.has(normalized)) return 'palette';

  // Color chips are sometimes mislabeled as text inputs; if the crop is a flat
  // solid, fill-check them instead of skipping as form chrome.
  if (
    (normalized === 'text input' ||
      normalized === 'search field' ||
      normalized === 'search bar') &&
    backgroundShare >= opts.minSolidImageShare
  ) {
    return 'fill';
  }

  // Promo tags / selected calendar days often arrive as "Text" because of the
  // caption glyph. Only reroute when the dominant fill is chromatic — paper
  // behind body/price copy must stay on the ink path.
  if (
    normalized === 'text' &&
    backgroundShare >= opts.minSolidImageShare &&
    background !== undefined &&
    labChroma(background) >= opts.solidTextMinChroma
  ) {
    return 'fill';
  }

  if (SKIP_LABELS.has(normalized)) return 'skip';

  if (normalized === 'solidfill' || normalized === 'solid fill') {
    return backgroundShare >= opts.minSolidImageShare ? 'fill' : 'skip';
  }

  if (normalized === 'image' || kind === 'image') {
    if (backgroundShare >= opts.minSolidImageShare) return 'fill';
    if (backgroundShare >= opts.minPaletteShare) return 'palette';
    return 'skip';
  }

  if (FILL_PLUS_INK_LABELS.has(normalized) || normalized.includes('button')) {
    // Pale chips/tags (light fill + colored label) need ink as well as fill.
    // Dark CTAs stay fill-only — button glyph AA still pollutes ink samples.
    return backgroundShare >= opts.minSolidShare ? 'fill' : 'skip';
  }

  if (FILL_LABELS.has(normalized)) {
    return backgroundShare >= opts.minSolidShare ? 'fill' : 'skip';
  }

  if (INK_LABELS.has(normalized) || kind === 'text') return 'ink';

  return 'skip';
}

export function rolesForStrategy(strategy: ColorStrategy): readonly ColorRole[] {
  switch (strategy) {
    case 'fill':
      return ['background'];
    case 'ink':
      return ['foreground'];
    case 'palette':
      return ['series'];
    case 'fill+ink':
      return ['background', 'foreground'];
    case 'skip':
      return [];
  }
}
