import type { ColorMeasurement, ElementPair, Rgb } from '@bulwark/domain';
import { assignPaletteRoles, containsBox, parseColor } from '@bulwark/domain';
import type { Raster } from '@bulwark/imaging';
import { clusterColors } from '@bulwark/imaging';
import type { Logger, LiveDomElement } from '@bulwark/ports';
import type { SurfaceElement } from '../surface/normalize.js';
import { cropWithPadding } from './typography-measurer.js';

export interface ColorMeasurerOptions {
  readonly clusterCount: number;
  readonly minForegroundShare: number;
  readonly minForegroundDeltaE: number;
  /** Fallback page background used when no opaque ancestor is found. */
  readonly pageBackground: string;
  /** Pixels trimmed from each edge of a crop before clustering. */
  readonly edgeInsetPx: number;
}

export interface ColorMeasurerDeps {
  readonly logger: Logger;
}

export interface ColorMeasurementOutcome {
  readonly measurements: readonly ColorMeasurement[];
  readonly warnings: readonly string[];
}

/**
 * Extracts design colors by clustering and pairs them with the live computed styles.
 */
export class ColorMeasurer {
  constructor(
    private readonly deps: ColorMeasurerDeps,
    private readonly options: ColorMeasurerOptions,
  ) {}

  measure(
    pairs: readonly ElementPair[],
    designRaster: Raster,
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

      const dom = liveSurface.dom;
      if (dom === undefined) {
        warnings.push(
          `Skipped colors for "${pair.designElement.label}": no DOM node was associated with ` +
            `the live element`,
        );
        continue;
      }

      // Trimming the edge keeps a border or a rounded corner's anti-aliasing from
      // competing with the fill for the dominant pool.
      const crop = cropWithPadding(
        designRaster,
        designSurface.sourceBox,
        -this.options.edgeInsetPx,
      );
      const clustered = clusterColors(crop, { k: this.options.clusterCount });
      const roles = assignPaletteRoles(clustered.clusters, {
        minForegroundShare: this.options.minForegroundShare,
        minForegroundDeltaE: this.options.minForegroundDeltaE,
      });

      const liveBackground = this.resolveLiveBackground(dom, domElements, warnings);
      const designForeground = roles.foreground?.color;
      const liveForeground =
        pair.designElement.kind === 'text' ? safeParse(dom.style.color) : undefined;

      measurements.push({
        designElementId: pair.designElement.id,
        liveElementId: pair.liveElement.id,
        designBox: pair.designElement.box,
        liveBox: pair.liveElement.box,
        label: pair.designElement.label,
        designBackground: roles.background.color,
        liveBackground,
        ...(designForeground === undefined || liveForeground === undefined
          ? {}
          : { designForeground, liveForeground }),
      });
    }

    return { measurements, warnings };
  }

  /**
   * Resolves what the element's background actually looks like on screen.
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
