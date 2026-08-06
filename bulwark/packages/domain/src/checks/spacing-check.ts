import type { DetectedElement } from '../elements/element.js';
import type { MatchResult } from '../matching/match-elements.js';
import type { ElementGap, GapGraphOptions } from '../spacing/gap-graph.js';
import { DEFAULT_GAP_GRAPH_OPTIONS, axisGap, buildGapGraph } from '../spacing/gap-graph.js';
import type { Defect, SpacingDefect } from '../defects/defect.js';
import { roundTo } from '../numeric.js';

export interface SpacingCheckOptions {
  /** A live gap may deviate from the design gap by this many pixels. */
  readonly tolerancePx: number;
  readonly gapGraph: GapGraphOptions;
}

export const DEFAULT_SPACING_CHECK_OPTIONS: SpacingCheckOptions = {
  tolerancePx: 2,
  gapGraph: DEFAULT_GAP_GRAPH_OPTIONS,
};

export interface SpacingComparison {
  readonly axis: 'vertical' | 'horizontal';
  readonly designGap: ElementGap;
  readonly designGapPx: number;
  readonly liveGapPx: number;
  readonly deltaPx: number;
  readonly withinTolerance: boolean;
  readonly designElementIds: readonly [string, string];
  readonly liveElementIds: readonly [string, string];
}

export interface SpacingCheckResult {
  readonly comparisons: readonly SpacingComparison[];
  readonly defects: readonly SpacingDefect[];
  /** Design gaps skipped because one of their endpoints has no live counterpart. */
  readonly skippedGaps: readonly ElementGap[];
}

/**
 * Compares the design's spacing rhythm against the live implementation.
 *
 * Adjacency comes from the design surface only. The live gap is then measured
 * directly between the two matched live boxes rather than from a second adjacency
 * pass, because a regression can insert or move an element and destroy the
 * adjacency we want to measure — the point is to measure the same relationship in
 * both surfaces, not to compare two independently-derived graphs.
 */
export function checkSpacing(
  designElements: readonly DetectedElement[],
  match: MatchResult,
  options: SpacingCheckOptions = DEFAULT_SPACING_CHECK_OPTIONS,
): SpacingCheckResult {
  if (options.tolerancePx < 0) {
    throw new RangeError('checkSpacing() requires a non-negative tolerancePx');
  }

  const designGaps = buildGapGraph(designElements, options.gapGraph);
  const liveByDesignId = new Map(
    match.pairs.map((pair) => [pair.designElement.id, pair.liveElement] as const),
  );

  const comparisons: SpacingComparison[] = [];
  const defects: SpacingDefect[] = [];
  const skippedGaps: ElementGap[] = [];

  for (const gap of designGaps) {
    const liveFrom = liveByDesignId.get(gap.fromElementId);
    const liveTo = liveByDesignId.get(gap.toElementId);
    if (liveFrom === undefined || liveTo === undefined) {
      skippedGaps.push(gap);
      continue;
    }

    const liveGapPx = roundTo(axisGap(liveFrom.box, liveTo.box, gap.axis), 4);
    const deltaPx = roundTo(liveGapPx - gap.gapPx, 4);
    const withinTolerance = Math.abs(deltaPx) <= options.tolerancePx;

    const comparison: SpacingComparison = {
      axis: gap.axis,
      designGap: gap,
      designGapPx: gap.gapPx,
      liveGapPx,
      deltaPx,
      withinTolerance,
      designElementIds: [gap.fromElementId, gap.toElementId],
      liveElementIds: [liveFrom.id, liveTo.id],
    };
    comparisons.push(comparison);

    if (!withinTolerance) {
      defects.push(toSpacingDefect(comparison, options.tolerancePx));
    }
  }

  return { comparisons, defects, skippedGaps };
}

export function spacingDefects(result: SpacingCheckResult): readonly Defect[] {
  return result.defects;
}

function toSpacingDefect(comparison: SpacingComparison, tolerancePx: number): SpacingDefect {
  const [fromId, toId] = comparison.designElementIds;
  const direction = comparison.deltaPx > 0 ? 'too much' : 'too little';
  return {
    id: `spacing:${comparison.axis}:${fromId}->${toId}`,
    type: 'spacing',
    severity: 'error',
    message:
      `${direction === 'too much' ? 'Extra' : 'Missing'} ${comparison.axis} space between ` +
      `"${fromId}" and "${toId}": design ${comparison.designGapPx}px, live ${comparison.liveGapPx}px ` +
      `(${formatSigned(comparison.deltaPx)}px, tolerance ±${tolerancePx}px)`,
    axis: comparison.axis,
    designGapPx: comparison.designGapPx,
    liveGapPx: comparison.liveGapPx,
    deltaPx: comparison.deltaPx,
    tolerancePx,
    betweenDesignElementIds: [fromId, toId],
    betweenLiveElementIds: comparison.liveElementIds,
    designElementId: fromId,
    liveElementId: comparison.liveElementIds[0],
  };
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
