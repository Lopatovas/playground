import type { Defect, QaReport, ReportTolerances, SurfaceDescriptor } from '@bulwark/domain';
import {
  FontRegistry,
  REPORT_SCHEMA_VERSION,
  checkColors,
  checkSpacing,
  checkStructure,
  checkTypography,
  matchElements,
  normalizeReportDefects,
  summarizeDefects,
  toReportPair,
} from '@bulwark/domain';
import { DEFAULT_TEXT_INK_OPTIONS } from '@bulwark/imaging';
import { parseColor } from '@bulwark/domain';
import { decodePng, flattenOnto } from '@bulwark/imaging';
import type {
  Clock,
  ElementDetector,
  IdGenerator,
  LiveCapture,
  Logger,
  TextRasterizer,
  TextRecognizer,
} from '@bulwark/ports';
import { sha256 } from '@bulwark/adapters';
import type { BulwarkConfig } from '../config/config.js';
import { associateDomElements, normalizeDetection } from '../surface/normalize.js';
import type { SurfaceElement } from '../surface/normalize.js';
import { TypographyMeasurer } from '../measure/typography-measurer.js';
import { ColorMeasurer } from '../measure/color-measurer.js';

export interface QaEngineDeps {
  readonly detector: ElementDetector;
  readonly recognizer: TextRecognizer;
  readonly rasterizer?: TextRasterizer;
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
}

export interface AnalyzeInput {
  /** PNG bytes of the exported design frame. */
  readonly designImage: Uint8Array;
  readonly live: LiveCapture;
  /** Artifact-relative paths recorded in the report for the dashboard. */
  readonly designImagePath: string;
  readonly liveImagePath: string;
  readonly runId?: string;
}

/**
 * Runs the full comparison for one design/live pair and returns a report.
 *
 * The order is deliberate: detect on both surfaces, normalise both into CSS-pixel
 * space, match by center point, then run each check over the matched set. Nothing in
 * this class touches the network or the filesystem, which is what lets the whole
 * pipeline be exercised with exact synthetic inputs.
 */
export class QaEngine {
  private readonly registry: FontRegistry;

  constructor(
    private readonly deps: QaEngineDeps,
    private readonly config: BulwarkConfig,
  ) {
    this.registry =
      config.typography.profiles === undefined
        ? new FontRegistry()
        : new FontRegistry(config.typography.profiles);
  }

  async analyze(input: AnalyzeInput): Promise<QaReport> {
    const startedAt = this.deps.clock.monotonicMs();
    const runId = input.runId ?? this.config.output.runId ?? this.deps.ids.nextId();
    const logger = this.deps.logger.child({ runId });
    const warnings: string[] = [];

    const designRaster = flattenOnto(
      decodePng(input.designImage),
      parseColor(this.config.design.flattenBackground),
    );
    const liveRaster = decodePng(input.live.screenshot);

    const [designDetection, liveDetection] = await Promise.all([
      this.deps.detector.detect({
        surface: 'design',
        image: input.designImage,
        ...(this.config.services.detector.minConfidence === undefined
          ? {}
          : { minConfidence: this.config.services.detector.minConfidence }),
        ...(this.config.services.detector.maxOverlap === undefined
          ? {}
          : { maxOverlap: this.config.services.detector.maxOverlap }),
      }),
      this.deps.detector.detect({
        surface: 'live',
        image: input.live.screenshot,
        ...(this.config.services.detector.minConfidence === undefined
          ? {}
          : { minConfidence: this.config.services.detector.minConfidence }),
        ...(this.config.services.detector.maxOverlap === undefined
          ? {}
          : { maxOverlap: this.config.services.detector.maxOverlap }),
      }),
    ]);

    const designSurface = normalizeDetection(designDetection, {
      surface: 'design',
      pixelRatio: this.config.design.pixelRatio,
      imageSize: { width: designRaster.width, height: designRaster.height },
    });
    const liveNormalized = normalizeDetection(liveDetection, {
      surface: 'live',
      pixelRatio: input.live.viewport.deviceScaleFactor,
      imageSize: { width: liveRaster.width, height: liveRaster.height },
    });

    const association = associateDomElements(liveNormalized, input.live.elements);
    if (association.unassociatedElementIds.length > 0) {
      warnings.push(
        `No DOM node matched ${association.unassociatedElementIds.length} detected live ` +
          `element(s): ${association.unassociatedElementIds.join(', ')}`,
      );
    }
    const liveSurface = association.elements;

    const designById = indexById(designSurface);
    const liveById = indexById(liveSurface);
    const designElements = designSurface.map((item) => item.element);
    const liveElements = liveSurface.map((item) => item.element);

    const match = matchElements(designElements, liveElements, {
      maxCenterDistance: this.config.matching.maxCenterDistancePx,
      minIou: this.config.matching.minIou,
      requireSameKind: this.config.matching.requireSameKind,
      labelMismatchPenalty: this.config.matching.labelMismatchPenalty,
      centerDistanceWeight: 1,
      iouWeight: 1,
    });

    logger.log('info', 'matched design elements to live elements', {
      designElements: designElements.length,
      liveElements: liveElements.length,
      pairs: match.pairs.length,
    });

    const defects: Defect[] = [];

    const structure = checkStructure(match, {
      centerTolerancePx: this.config.tolerances.positionPx,
      reportUnexpectedElements: this.config.checks.reportUnexpectedElements,
    });
    if (this.config.checks.position) {
      defects.push(...structure.positionDefects);
    }
    defects.push(...structure.missingDefects, ...structure.unexpectedDefects);

    const spacing = checkSpacing(designElements, match, {
      tolerancePx: this.config.tolerances.spacingPx,
      gapGraph: {
        minCrossAxisOverlapRatio: this.config.spacing.minCrossAxisOverlapRatio,
        maxGapPx: this.config.spacing.maxGapPx,
      },
    });
    if (this.config.checks.spacing) defects.push(...spacing.defects);
    if (spacing.skippedGaps.length > 0) {
      warnings.push(
        `Skipped ${spacing.skippedGaps.length} spacing comparison(s) because one endpoint had ` +
          `no live counterpart`,
      );
    }

    const typographyMeasurer = new TypographyMeasurer(
      {
        recognizer: this.deps.recognizer,
        ...(this.deps.rasterizer === undefined ? {} : { rasterizer: this.deps.rasterizer }),
        registry: this.registry,
        logger,
      },
      {
        cropPaddingPx: 0,
        textInk: { ...DEFAULT_TEXT_INK_OPTIONS, mode: this.config.typography.heightMeasurement },
        candidateFamilies: this.config.checks.fontFamily
          ? this.config.typography.candidateFamilies
          : [],
      },
    );
    const typographyMeasurements = await typographyMeasurer.measure(
      match.pairs,
      designRaster,
      designById,
      liveById,
    );
    warnings.push(...typographyMeasurements.warnings);

    const typography = checkTypography(typographyMeasurements.measurements, this.registry, {
      fontSizeTolerancePx: this.config.tolerances.fontSizePx,
      minFamilyMargin: this.config.tolerances.minFamilyMargin,
      designPixelRatio: this.config.design.pixelRatio,
      checkFontWeight: this.config.checks.fontWeight,
      checkFontFamily: this.config.checks.fontFamily,
    });
    if (this.config.checks.fontSize) defects.push(...typography.sizeDefects);
    defects.push(...typography.weightDefects, ...typography.familyDefects);
    for (const skipped of typography.skipped) {
      warnings.push(
        `Skipped typography for "${skipped.measurement.text}": ${skipped.reason}`,
      );
    }

    const colorMeasurer = new ColorMeasurer(
      { logger },
      {
        clusterCount: this.config.color.clusterCount,
        minForegroundShare: this.config.color.minForegroundShare,
        minForegroundDeltaE: this.config.color.minForegroundDeltaE,
        pageBackground: this.config.design.flattenBackground,
        edgeInsetPx: 1,
      },
    );
    const colorMeasurements = this.config.checks.color
      ? colorMeasurer.measure(match.pairs, designRaster, designById, liveById, input.live.elements)
      : { measurements: [], warnings: [] };
    warnings.push(...colorMeasurements.warnings);

    const colors = checkColors(colorMeasurements.measurements, {
      deltaEThreshold: this.config.tolerances.deltaE,
      weights: { lightness: 1, chroma: 1, hue: 1 },
      checkForeground: this.config.color.checkForeground,
    });
    if (this.config.checks.color) defects.push(...colors.defects);

    const orderedDefects = normalizeReportDefects(defects);
    const durationMs = Math.round(this.deps.clock.monotonicMs() - startedAt);

    return {
      schemaVersion: REPORT_SCHEMA_VERSION,
      runId,
      generatedAt: this.deps.clock.nowIso(),
      target: { url: input.live.url, viewport: input.live.viewport },
      surfaces: {
        design: describeSurface(input.designImagePath, designRaster.width, designRaster.height, input.designImage),
        live: describeSurface(input.liveImagePath, liveRaster.width, liveRaster.height, input.live.screenshot),
      },
      tolerances: this.reportTolerances(),
      summary: summarizeDefects(orderedDefects, {
        designElementCount: designElements.length,
        liveElementCount: liveElements.length,
        matchedElementCount: match.pairs.length,
      }),
      defects: orderedDefects,
      measurements: {
        designElements,
        liveElements,
        pairs: match.pairs.map(toReportPair),
        spacing: spacing.comparisons,
        typography: typography.findings,
        colors: colors.comparisons,
      },
      diagnostics: {
        warnings: [...warnings].sort(),
        detector: this.deps.detector.name,
        textRecognizer: this.deps.recognizer.name,
        durationMs,
      },
    };
  }

  private reportTolerances(): ReportTolerances {
    return {
      spacingPx: this.config.tolerances.spacingPx,
      positionPx: this.config.tolerances.positionPx,
      fontSizePx: this.config.tolerances.fontSizePx,
      deltaE: this.config.tolerances.deltaE,
      minFamilyMargin: this.config.tolerances.minFamilyMargin,
    };
  }
}

function indexById(elements: readonly SurfaceElement[]): ReadonlyMap<string, SurfaceElement> {
  return new Map(elements.map((item) => [item.element.id, item] as const));
}

function describeSurface(
  imagePath: string,
  width: number,
  height: number,
  bytes: Uint8Array,
): SurfaceDescriptor {
  return { imagePath, width, height, imageSha256: sha256(bytes) };
}