import type { BoundingBox } from '../geometry/box.js';
import type { ElementKind } from '../elements/element.js';
import { compareStrings } from '../numeric.js';

export type DefectType =
  | 'spacing'
  | 'position'
  | 'missing-element'
  | 'unexpected-element'
  | 'font-size'
  | 'font-weight'
  | 'font-family'
  | 'color';

export type DefectSeverity = 'error' | 'warning' | 'info';

/** Fields shared by every defect so report consumers can render one list. */
export interface DefectBase {
  readonly id: string;
  readonly type: DefectType;
  readonly severity: DefectSeverity;
  /** Human-readable one-liner, safe to show verbatim in the dashboard. */
  readonly message: string;
  /** Design-space box the dashboard should highlight. */
  readonly designBox?: BoundingBox;
  /** Live-space box the dashboard should highlight. */
  readonly liveBox?: BoundingBox;
  readonly designElementId?: string;
  readonly liveElementId?: string;
}

export interface SpacingDefect extends DefectBase {
  readonly type: 'spacing';
  readonly axis: 'vertical' | 'horizontal';
  readonly designGapPx: number;
  readonly liveGapPx: number;
  readonly deltaPx: number;
  readonly tolerancePx: number;
  readonly betweenDesignElementIds: readonly [string, string];
  readonly betweenLiveElementIds: readonly [string, string];
}

export interface PositionDefect extends DefectBase {
  readonly type: 'position';
  readonly offsetXPx: number;
  readonly offsetYPx: number;
  readonly distancePx: number;
  readonly tolerancePx: number;
}

export interface MissingElementDefect extends DefectBase {
  readonly type: 'missing-element';
  readonly kind: ElementKind;
  readonly label: string;
}

export interface UnexpectedElementDefect extends DefectBase {
  readonly type: 'unexpected-element';
  readonly kind: ElementKind;
  readonly label: string;
}

export interface FontSizeDefect extends DefectBase {
  readonly type: 'font-size';
  /** CSS px derived from the design raster via cap-height projection. */
  readonly expectedCssPx: number;
  /** CSS px read from the browser's computed style. */
  readonly actualCssPx: number;
  readonly deltaPx: number;
  readonly tolerancePx: number;
  readonly measuredVisualHeightPx: number;
  readonly fontFamily: string;
  readonly visualToCssRatio: number;
}

export interface FontWeightDefect extends DefectBase {
  readonly type: 'font-weight';
  readonly expectedWeight: number;
  readonly actualWeight: number;
  readonly strokeDensity: number;
  readonly fontFamily: string;
}

export interface FontFamilyDefect extends DefectBase {
  readonly type: 'font-family';
  readonly expectedFamily: string;
  readonly actualFamily: string;
  readonly expectedFamilyScore: number;
  readonly actualFamilyScore: number;
  readonly scoreMargin: number;
}

export type ColorRole = 'background' | 'foreground' | 'series';

export interface ColorDefect extends DefectBase {
  readonly type: 'color';
  readonly role: ColorRole;
  readonly expectedHex: string;
  readonly actualHex: string;
  readonly deltaE2000: number;
  readonly threshold: number;
}

export type Defect =
  | SpacingDefect
  | PositionDefect
  | MissingElementDefect
  | UnexpectedElementDefect
  | FontSizeDefect
  | FontWeightDefect
  | FontFamilyDefect
  | ColorDefect;

const DEFECT_TYPE_ORDER: readonly DefectType[] = [
  'missing-element',
  'unexpected-element',
  'position',
  'spacing',
  'font-size',
  'font-weight',
  'font-family',
  'color',
];

const SEVERITY_ORDER: readonly DefectSeverity[] = ['error', 'warning', 'info'];

/**
 * Total order for report output: severity, then defect type, then id. Reports are
 * diffed between runs, so a stable order matters more than a clever one.
 */
export function compareDefects(a: Defect, b: Defect): number {
  const severityDelta = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
  if (severityDelta !== 0) return severityDelta;
  const typeDelta = DEFECT_TYPE_ORDER.indexOf(a.type) - DEFECT_TYPE_ORDER.indexOf(b.type);
  if (typeDelta !== 0) return typeDelta;
  return compareStrings(a.id, b.id);
}

export function sortDefects(defects: readonly Defect[]): Defect[] {
  return [...defects].sort(compareDefects);
}

export function countBy<K extends string>(
  defects: readonly Defect[],
  select: (defect: Defect) => K,
): Record<K, number> {
  const counts = {} as Record<K, number>;
  for (const defect of defects) {
    const key = select(defect);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
