import type { Defect, DefectSeverity, DefectType } from '../defects/defect.js';
import { countBy, sortDefects } from '../defects/defect.js';
import type { DetectedElement } from '../elements/element.js';
import type { ElementPair } from '../matching/match-elements.js';
import type { SpacingComparison } from '../checks/spacing-check.js';
import type { TypographyFinding } from '../checks/typography-check.js';
import type { ColorComparison } from '../checks/color-check.js';
import { roundTo } from '../numeric.js';

export const REPORT_SCHEMA_VERSION = 1;

export interface Viewport {
  readonly width: number;
  readonly height: number;
  readonly deviceScaleFactor: number;
}

export interface SurfaceDescriptor {
  /** Artifact-relative path, so a report stays valid when the folder moves. */
  readonly imagePath: string;
  readonly width: number;
  readonly height: number;
  /** sha256 of the image bytes, so a report can be tied to exact pixels. */
  readonly imageSha256: string;
}

export interface ReportTolerances {
  readonly spacingPx: number;
  readonly positionPx: number;
  readonly fontSizePx: number;
  readonly deltaE: number;
  readonly minFamilyMargin: number;
}

export interface ReportSummary {
  readonly passed: boolean;
  readonly totalDefects: number;
  readonly bySeverity: Readonly<Partial<Record<DefectSeverity, number>>>;
  readonly byType: Readonly<Partial<Record<DefectType, number>>>;
  readonly designElementCount: number;
  readonly liveElementCount: number;
  readonly matchedElementCount: number;
  /** Share of design elements that found a live counterpart, in [0, 1]. */
  readonly matchRate: number;
}

export interface ReportMeasurements {
  readonly designElements: readonly DetectedElement[];
  readonly liveElements: readonly DetectedElement[];
  readonly pairs: readonly ReportPair[];
  readonly spacing: readonly SpacingComparison[];
  readonly typography: readonly TypographyFinding[];
  readonly colors: readonly ColorComparison[];
}

export interface ReportPair {
  readonly designElementId: string;
  readonly liveElementId: string;
  readonly centerOffset: { readonly dx: number; readonly dy: number };
  readonly centerDistance: number;
  readonly iou: number;
}

export interface ReportDiagnostics {
  /** Non-fatal conditions worth surfacing, e.g. skipped measurements. */
  readonly warnings: readonly string[];
  readonly detector: string;
  readonly textRecognizer: string;
  readonly durationMs: number;
}

/**
 * The single artifact the whole system revolves around: the CLI and API write it,
 * the dashboard reads it, and CI gates on its summary.
 */
export interface QaReport {
  readonly schemaVersion: typeof REPORT_SCHEMA_VERSION;
  readonly runId: string;
  readonly generatedAt: string;
  readonly target: {
    readonly url: string;
    readonly viewport: Viewport;
  };
  readonly surfaces: {
    readonly design: SurfaceDescriptor;
    readonly live: SurfaceDescriptor;
  };
  readonly tolerances: ReportTolerances;
  readonly summary: ReportSummary;
  readonly defects: readonly Defect[];
  readonly measurements: ReportMeasurements;
  readonly diagnostics: ReportDiagnostics;
}

export function toReportPair(pair: ElementPair): ReportPair {
  return {
    designElementId: pair.designElement.id,
    liveElementId: pair.liveElement.id,
    centerOffset: pair.centerOffset,
    centerDistance: pair.centerDistance,
    iou: pair.iou,
  };
}

export function summarizeDefects(
  defects: readonly Defect[],
  counts: {
    readonly designElementCount: number;
    readonly liveElementCount: number;
    readonly matchedElementCount: number;
  },
): ReportSummary {
  const errorCount = defects.filter((defect) => defect.severity === 'error').length;
  return {
    passed: errorCount === 0,
    totalDefects: defects.length,
    bySeverity: countBy(defects, (defect) => defect.severity),
    byType: countBy(defects, (defect) => defect.type),
    designElementCount: counts.designElementCount,
    liveElementCount: counts.liveElementCount,
    matchedElementCount: counts.matchedElementCount,
    matchRate:
      counts.designElementCount === 0
        ? 1
        : roundTo(counts.matchedElementCount / counts.designElementCount, 4),
  };
}

/** Orders defects for output. Call this before writing a report. */
export function normalizeReportDefects(defects: readonly Defect[]): readonly Defect[] {
  return sortDefects(defects);
}
