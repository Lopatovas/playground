import type { DetectedElement } from '../elements/element.js';
import { compareElementsInReadingOrder } from '../elements/element.js';
import type { BoundingBox } from '../geometry/box.js';
import { boxHeight, boxWidth, horizontalOverlap, verticalOverlap } from '../geometry/box.js';
import { compareStrings, roundTo } from '../numeric.js';

export type GapAxis = 'vertical' | 'horizontal';

/**
 * The pixel gap between two elements that sit next to each other on one axis.
 *
 * `from` always precedes `to` along the axis, so a negative gap means the two
 * elements overlap — which is itself a layout signal worth reporting.
 */
export interface ElementGap {
  readonly axis: GapAxis;
  readonly fromElementId: string;
  readonly toElementId: string;
  readonly gapPx: number;
  /** Overlap of the two boxes on the perpendicular axis, in pixels. */
  readonly crossAxisOverlapPx: number;
}

export interface GapGraphOptions {
  /**
   * Minimum share of the narrower element's cross-axis extent that must overlap
   * before two elements count as neighbours. Without this, a sidebar item and a
   * footer button would be treated as vertically adjacent.
   */
  readonly minCrossAxisOverlapRatio: number;
  /** Neighbours further apart than this are treated as unrelated. */
  readonly maxGapPx: number;
}

export const DEFAULT_GAP_GRAPH_OPTIONS: GapGraphOptions = {
  minCrossAxisOverlapRatio: 0.5,
  maxGapPx: 400,
};

/**
 * Signed gap between two boxes along one axis, using `a` as the earlier element:
 * `b.min - a.max`.
 */
export function axisGap(a: BoundingBox, b: BoundingBox, axis: GapAxis): number {
  return axis === 'vertical' ? b.yMin - a.yMax : b.xMin - a.xMax;
}

/**
 * Builds the adjacency gaps for one surface.
 *
 * Only the nearest neighbour in each direction is kept: measuring every pairwise
 * distance would produce a quadratic pile of gaps that mostly describe unrelated
 * elements, and rhythm defects (padding, gutters, stack spacing) always show up
 * between immediate neighbours.
 *
 * Adjacency is forward-only along the axis, which also means a child nested inside
 * its container never produces a gap: neither box starts after the other ends.
 */
export function buildGapGraph(
  elements: readonly DetectedElement[],
  options: GapGraphOptions = DEFAULT_GAP_GRAPH_OPTIONS,
): readonly ElementGap[] {
  assertOptions(options);
  const sorted = [...elements].sort(compareElementsInReadingOrder);
  const gaps: ElementGap[] = [];

  for (const axis of ['vertical', 'horizontal'] as const) {
    for (const from of sorted) {
      let best: ElementGap | null = null;
      for (const to of sorted) {
        if (from.id === to.id) continue;

        const overlap = axis === 'vertical' ? horizontalOverlap(from.box, to.box) : verticalOverlap(from.box, to.box);
        const requiredOverlap = requiredCrossAxisOverlap(from.box, to.box, axis, options);
        if (overlap < requiredOverlap || overlap <= 0) continue;

        const gap = axisGap(from.box, to.box, axis);
        if (gap < 0) continue; // `to` starts before `from` ends: not a forward neighbour.
        if (gap > options.maxGapPx) continue;

        const candidate: ElementGap = {
          axis,
          fromElementId: from.id,
          toElementId: to.id,
          gapPx: roundTo(gap, 4),
          crossAxisOverlapPx: roundTo(overlap, 4),
        };
        if (best === null || isBetterNeighbour(candidate, best)) best = candidate;
      }
      if (best !== null) gaps.push(best);
    }
  }

  return gaps.sort(compareGaps);
}

export function compareGaps(a: ElementGap, b: ElementGap): number {
  if (a.axis !== b.axis) return a.axis === 'vertical' ? -1 : 1;
  const fromDelta = compareStrings(a.fromElementId, b.fromElementId);
  if (fromDelta !== 0) return fromDelta;
  return compareStrings(a.toElementId, b.toElementId);
}

function isBetterNeighbour(candidate: ElementGap, incumbent: ElementGap): boolean {
  if (candidate.gapPx !== incumbent.gapPx) return candidate.gapPx < incumbent.gapPx;
  // Prefer the neighbour that lines up better, then fall back to id order.
  if (candidate.crossAxisOverlapPx !== incumbent.crossAxisOverlapPx) {
    return candidate.crossAxisOverlapPx > incumbent.crossAxisOverlapPx;
  }
  return compareStrings(candidate.toElementId, incumbent.toElementId) < 0;
}

function requiredCrossAxisOverlap(
  a: BoundingBox,
  b: BoundingBox,
  axis: GapAxis,
  options: GapGraphOptions,
): number {
  const extentA = axis === 'vertical' ? boxWidth(a) : boxHeight(a);
  const extentB = axis === 'vertical' ? boxWidth(b) : boxHeight(b);
  return Math.min(extentA, extentB) * options.minCrossAxisOverlapRatio;
}

function assertOptions(options: GapGraphOptions): void {
  if (options.minCrossAxisOverlapRatio < 0 || options.minCrossAxisOverlapRatio > 1) {
    throw new RangeError('buildGapGraph() requires minCrossAxisOverlapRatio within [0, 1]');
  }
  if (options.maxGapPx <= 0) {
    throw new RangeError('buildGapGraph() requires maxGapPx > 0');
  }
}
