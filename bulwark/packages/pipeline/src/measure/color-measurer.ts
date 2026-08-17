import type { ColorMeasurement, ColorRole, ElementPair, Rgb } from '@bulwark/domain';
import {
  assignPaletteRoles,
  containsBox,
  deltaE2000Rgb,
  labChroma,
  normalizeLabel,
  parseColor,
  relativeLuminance,
} from '@bulwark/domain';
import type { ExtractedInkColor, Raster } from '@bulwark/imaging';
import { clusterColors, extractInkColor, extractSeriesPalette } from '@bulwark/imaging';
import type { Logger, LiveDomElement } from '@bulwark/ports';
import type { SurfaceElement } from '../surface/normalize.js';
import { cropWithPadding } from './typography-measurer.js';
import {
  classifyColorStrategy,
  rolesForStrategy,
  type ColorStrategy,
  type ColorStrategyOptions,
} from './color-strategy.js';

export type LiveColorSource = 'raster' | 'css';

/** How crops are turned into role colors before the ΔE check. */
export type ColorMode = 'specialized' | 'cluster';

export interface ColorMeasurerOptions {
  readonly clusterCount: number;
  readonly minForegroundShare: number;
  readonly minForegroundDeltaE: number;
  /** Fallback page background used when CSS mode finds no opaque ancestor. */
  readonly pageBackground: string;
  /** Pixels trimmed from each edge of a crop before clustering / masking. */
  readonly edgeInsetPx: number;
  /**
   * How live colors are obtained.
   * - `raster` (default): same pixel path as the design PNG crop
   * - `css`: computed styles / ancestor walk (legacy)
   */
  readonly liveSource: LiveColorSource;
  /**
   * `specialized` (default): fill BG and/or ink-masked FG by element class.
   * `cluster`: legacy k-means roles on every matched pair.
   */
  readonly mode: ColorMode;
  readonly strategy: ColorStrategyOptions;
  /** Minimum ink pixels before an ink-masked foreground is trusted. */
  readonly minInkPixels: number;
  /**
   * Max ΔE between design/live paper (border BG). Larger gaps usually mean a bad
   * match or crop, not a real font-color bug.
   */
  readonly maxInkBackgroundDeltaE: number;
  /** Max relative ink-share mismatch |d-l|/max(d,l) before skipping the pair. */
  readonly maxInkShareMismatch: number;
  /**
   * Lab chroma at/above which ink share mismatch uses {@link maxAccentInkShareMismatch}
   * (accent links/deltas are often thinner / AA-heavier than body text).
   */
  readonly inkAccentChroma: number;
  /** Looser share gate for chromatic ink pairs. */
  readonly maxAccentInkShareMismatch: number;
}

export interface ColorMeasurerDeps {
  readonly logger: Logger;
}

export interface ColorMeasurementOutcome {
  readonly measurements: readonly ColorMeasurement[];
  readonly warnings: readonly string[];
}

/**
 * Extracts design (and optionally live) colors for the color check.
 *
 * Specialized mode routes solid controls through fill clustering and text through
 * border-background + farthest-mode ink sampling so button fills and font colors
 * each get a checker that matches the visual question being asked.
 */
export class ColorMeasurer {
  constructor(
    private readonly deps: ColorMeasurerDeps,
    private readonly options: ColorMeasurerOptions,
  ) {}

  measure(
    pairs: readonly ElementPair[],
    designRaster: Raster,
    liveRaster: Raster,
    designElementsById: ReadonlyMap<string, SurfaceElement>,
    liveElementsById: ReadonlyMap<string, SurfaceElement>,
    domElements: readonly LiveDomElement[],
  ): ColorMeasurementOutcome {
    const measurements: ColorMeasurement[] = [];
    const warnings: string[] = [];

    for (const pair of pairs) {
      const designSurface = designElementsById.get(pair.designElement.id);
      const liveSurface = liveElementsById.get(pair.liveElement.id);
      if (designSurface === undefined || liveSurface === undefined) continue;

      if (this.options.mode === 'cluster') {
        const measurement = this.measureClusterPair(
          pair,
          designRaster,
          liveRaster,
          designSurface,
          liveSurface,
          domElements,
          warnings,
        );
        if (measurement !== undefined) measurements.push(measurement);
        continue;
      }

      const measurement = this.measureSpecializedPair(
        pair,
        designRaster,
        liveRaster,
        designSurface,
        liveSurface,
        domElements,
        warnings,
      );
      if (measurement !== undefined) measurements.push(measurement);
    }

    return { measurements, warnings };
  }

  private measureSpecializedPair(
    pair: ElementPair,
    designRaster: Raster,
    liveRaster: Raster,
    designSurface: SurfaceElement,
    liveSurface: SurfaceElement,
    domElements: readonly LiveDomElement[],
    warnings: string[],
  ): ColorMeasurement | undefined {
    const designCrop = this.crop(designRaster, designSurface.sourceBox);
    if (designCrop === undefined) {
      warnings.push(
        `Skipped colors for "${pair.designElement.label}": design crop was empty after inset`,
      );
      return undefined;
    }
    const designRoles = this.rolesFromCrop(designCrop);
    const strategy = classifyColorStrategy(
      pair.designElement.label,
      pair.designElement.kind,
      designRoles.background.share,
      this.options.strategy,
      designRoles.background.color,
    );

    const compareRoles = rolesForStrategy(strategy);
    if (compareRoles.length === 0) return undefined;

    let liveBackground: Rgb | undefined;
    let liveForeground: Rgb | undefined;
    let designBackground = designRoles.background.color;
    let designForeground: Rgb | undefined;
    let designSeries: readonly Rgb[] | undefined;
    let liveSeries: readonly Rgb[] | undefined;

    let activeStrategy = strategy;
    let activeRoles = compareRoles;

    // Pale chip/tag buttons: fill alone only sees the wash; the planted bug is often
    // the label ink. Upgrade to fill+ink when the dominant fill is near-white.
    if (
      strategy === 'fill' &&
      (normalizeLabel(pair.designElement.label).includes('button') ||
        normalizeLabel(pair.designElement.label) === 'button') &&
      relativeLuminance(designBackground) >= 0.85
    ) {
      activeStrategy = 'fill+ink';
      activeRoles = rolesForStrategy('fill+ink');
    }

    const needsFill = activeRoles.includes('background');
    const needsInk = activeRoles.includes('foreground');
    const needsPalette = activeRoles.includes('series');

    if (needsPalette) {
      if (this.options.liveSource === 'css') {
        warnings.push(
          `Skipped palette colors for "${pair.designElement.label}": CSS live source cannot ` +
            `sample multi-stop chart pixels`,
        );
        return undefined;
      }
      const liveCrop = this.crop(liveRaster, liveSurface.sourceBox);
      if (liveCrop === undefined) {
        warnings.push(
          `Skipped palette colors for "${pair.designElement.label}": live crop was empty after inset`,
        );
        return undefined;
      }
      designSeries = extractSeriesPalette(designCrop);
      liveSeries = extractSeriesPalette(liveCrop);
      if (designSeries.length === 0 || liveSeries.length === 0) {
        warnings.push(
          `Skipped palette colors for "${pair.designElement.label}": no chromatic series stops ` +
            `recovered (design=${designSeries.length}, live=${liveSeries.length})`,
        );
        return undefined;
      }
      return this.toMeasurement(pair, {
        strategy: activeStrategy,
        compareRoles: ['series'],
        designBackground,
        liveBackground: designBackground,
        designSeries,
        liveSeries,
      });
    }

    if (this.options.liveSource === 'css') {
      const dom = liveSurface.dom;
      if (dom === undefined) {
        warnings.push(
          `Skipped colors for "${pair.designElement.label}": no DOM node was associated with ` +
            `the live element`,
        );
        return undefined;
      }
      if (needsFill) {
        liveBackground = this.resolveLiveBackground(dom, domElements, warnings);
      }
      if (needsInk) {
        liveForeground = safeParse(dom.style.color);
        designForeground = this.measureInk(designCrop)?.color ?? designRoles.foreground?.color;
      }
    } else {
      const liveCrop = this.crop(liveRaster, liveSurface.sourceBox);
      if (liveCrop === undefined) {
        warnings.push(
          `Skipped colors for "${pair.designElement.label}": live crop was empty after inset`,
        );
        return undefined;
      }

      if (needsFill) {
        liveBackground = this.rolesFromCrop(liveCrop).background.color;
      }
      if (needsInk) {
        const designInk = this.measureInk(designCrop);
        const liveInk = this.measureInk(liveCrop);
        if (!this.inkPairIsStable(designInk, liveInk)) {
          warnings.push(
            `Skipped ink color for "${pair.designElement.label}": crop had unstable ink ` +
              `(need ≥${this.options.minInkPixels} confident pixels, matching polarity/` +
              `luminance/background/share)`,
          );
          if (!needsFill) return undefined;
        } else {
          designForeground = designInk!.color;
          liveForeground = liveInk!.color;
        }
      }
    }

    return this.toMeasurement(pair, {
      strategy: activeStrategy,
      compareRoles: this.activeRoles(activeRoles, {
        designBackground,
        liveBackground,
        designForeground,
        liveForeground,
      }),
      designBackground,
      liveBackground: liveBackground ?? designBackground,
      designForeground,
      liveForeground,
    });
  }

  private measureClusterPair(
    pair: ElementPair,
    designRaster: Raster,
    liveRaster: Raster,
    designSurface: SurfaceElement,
    liveSurface: SurfaceElement,
    domElements: readonly LiveDomElement[],
    warnings: string[],
  ): ColorMeasurement | undefined {
    const designCrop = this.crop(designRaster, designSurface.sourceBox);
    if (designCrop === undefined) {
      warnings.push(
        `Skipped colors for "${pair.designElement.label}": design crop was empty after inset`,
      );
      return undefined;
    }
    const designRoles = this.rolesFromCrop(designCrop);

    let liveBackground: Rgb;
    let liveForeground: Rgb | undefined;

    if (this.options.liveSource === 'raster') {
      const liveCrop = this.crop(liveRaster, liveSurface.sourceBox);
      if (liveCrop === undefined) {
        warnings.push(
          `Skipped colors for "${pair.designElement.label}": live crop was empty after inset`,
        );
        return undefined;
      }
      const liveRoles = this.rolesFromCrop(liveCrop);
      liveBackground = liveRoles.background.color;
      liveForeground = liveRoles.foreground?.color;
    } else {
      const dom = liveSurface.dom;
      if (dom === undefined) {
        warnings.push(
          `Skipped colors for "${pair.designElement.label}": no DOM node was associated with ` +
            `the live element`,
        );
        return undefined;
      }
      liveBackground = this.resolveLiveBackground(dom, domElements, warnings);
      liveForeground =
        pair.designElement.kind === 'text' ? safeParse(dom.style.color) : undefined;
    }

    const designForeground = designRoles.foreground?.color;
    const compareRoles: ColorRole[] = ['background'];
    if (designForeground !== undefined && liveForeground !== undefined) {
      compareRoles.push('foreground');
    }

    return this.toMeasurement(pair, {
      strategy: 'fill+ink',
      compareRoles,
      designBackground: designRoles.background.color,
      liveBackground,
      designForeground,
      liveForeground,
    });
  }

  private toMeasurement(
    pair: ElementPair,
    colors: {
      strategy: ColorStrategy;
      compareRoles: readonly ColorRole[];
      designBackground: Rgb;
      liveBackground: Rgb;
      designForeground?: Rgb;
      liveForeground?: Rgb;
      designSeries?: readonly Rgb[];
      liveSeries?: readonly Rgb[];
    },
  ): ColorMeasurement | undefined {
    if (colors.compareRoles.length === 0) return undefined;
    return {
      designElementId: pair.designElement.id,
      liveElementId: pair.liveElement.id,
      designBox: pair.designElement.box,
      liveBox: pair.liveElement.box,
      label: pair.designElement.label,
      strategy: colors.strategy,
      compareRoles: colors.compareRoles,
      designBackground: colors.designBackground,
      liveBackground: colors.liveBackground,
      ...(colors.designForeground === undefined || colors.liveForeground === undefined
        ? {}
        : {
            designForeground: colors.designForeground,
            liveForeground: colors.liveForeground,
          }),
      ...(colors.designSeries === undefined || colors.liveSeries === undefined
        ? {}
        : {
            designSeries: colors.designSeries,
            liveSeries: colors.liveSeries,
          }),
    };
  }

  private activeRoles(
    requested: readonly ColorRole[],
    colors: {
      designBackground: Rgb;
      liveBackground?: Rgb;
      designForeground?: Rgb;
      liveForeground?: Rgb;
      designSeries?: readonly Rgb[];
      liveSeries?: readonly Rgb[];
    },
  ): readonly ColorRole[] {
    return requested.filter((role) => {
      if (role === 'background') return colors.liveBackground !== undefined;
      if (role === 'series') {
        return (
          (colors.designSeries?.length ?? 0) > 0 && (colors.liveSeries?.length ?? 0) > 0
        );
      }
      return colors.designForeground !== undefined && colors.liveForeground !== undefined;
    });
  }

  private crop(raster: Raster, box: SurfaceElement['sourceBox']): Raster | undefined {
    const crop = cropWithPadding(raster, box, -this.options.edgeInsetPx);
    if (crop.width <= 0 || crop.height <= 0 || crop.data.length === 0) return undefined;
    return crop;
  }

  private rolesFromCrop(crop: Raster) {
    const clustered = clusterColors(crop, { k: this.options.clusterCount });
    return assignPaletteRoles(clustered.clusters, {
      minForegroundShare: this.options.minForegroundShare,
      minForegroundDeltaE: this.options.minForegroundDeltaE,
    });
  }

  private measureInk(crop: Raster): ExtractedInkColor | undefined {
    return extractInkColor(crop, { minInkPixels: this.options.minInkPixels, tighten: true });
  }

  /**
   * Rejects ink pairs that disagree on polarity, luminance, paper color, or glyph density —
   * those usually mean a padded/mismatched crop rather than a real font-color change.
   */
  private inkPairIsStable(
    designInk: ExtractedInkColor | undefined,
    liveInk: ExtractedInkColor | undefined,
  ): boolean {
    if (designInk === undefined || liveInk === undefined) return false;
    if (designInk.polarity !== liveInk.polarity) return false;

    const luminanceGap = Math.abs(
      relativeLuminance(designInk.color) - relativeLuminance(liveInk.color),
    );
    const chroma = Math.max(labChroma(designInk.color), labChroma(liveInk.color));
    const accent = chroma >= this.options.inkAccentChroma;
    // Accent links/deltas often shift lightness with hue; allow a wider gap.
    if (luminanceGap > (accent ? 0.5 : 0.35)) return false;

    const backgroundGap = deltaE2000Rgb(designInk.background, liveInk.background);
    const bgCap = accent
      ? this.options.maxInkBackgroundDeltaE + 8
      : this.options.maxInkBackgroundDeltaE;
    if (backgroundGap > bgCap) return false;

    const maxShare = Math.max(designInk.inkShare, liveInk.inkShare);
    if (maxShare > 0) {
      const shareMismatch = Math.abs(designInk.inkShare - liveInk.inkShare) / maxShare;
      const shareCap = accent
        ? this.options.maxAccentInkShareMismatch
        : this.options.maxInkShareMismatch;
      if (shareMismatch > shareCap) return false;
    }

    return true;
  }

  /**
   * Resolves what the element's background actually looks like via CSS (legacy mode).
   *
   * A transparent `background-color` does not mean the pixels are transparent — it
   * means the nearest opaque ancestor shows through. Comparing a design fill against
   * `rgba(0, 0, 0, 0)` would report a defect on every element that inherits its
   * background, which is most of them.
   */
  private resolveLiveBackground(
    dom: LiveDomElement,
    domElements: readonly LiveDomElement[],
    warnings: string[],
  ): Rgb {
    if (!dom.hasTransparentBackground) {
      const own = safeParse(dom.style.backgroundColor);
      if (own !== undefined) return own;
    }

    const ancestors = domElements
      .filter((candidate) => !candidate.hasTransparentBackground)
      .filter((candidate) => containsBox(candidate.box, dom.box))
      .sort((a, b) => b.depth - a.depth);

    for (const ancestor of ancestors) {
      const color = safeParse(ancestor.style.backgroundColor);
      if (color !== undefined) return color;
    }

    this.deps.logger.log(
      'debug',
      'no opaque ancestor background found; using the page background',
      {
        element: dom.id,
      },
    );
    warnings.push(
      `"${dom.id}" has a transparent background and no opaque ancestor; compared against the ` +
        `configured page background ${this.options.pageBackground}`,
    );
    return parseColor(this.options.pageBackground);
  }
}

function safeParse(color: string): Rgb | undefined {
  try {
    return parseColor(color);
  } catch {
    return undefined;
  }
}
