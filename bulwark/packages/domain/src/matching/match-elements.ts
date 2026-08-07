import type { DetectedElement } from '../elements/element.js';
import { compareElementsInReadingOrder, normalizeLabel } from '../elements/element.js';
import { boxCenter, distance, intersectionOverUnion } from '../geometry/box.js';
import { compareStrings, roundTo } from '../numeric.js';

export interface MatchingOptions {
  /** Hard gate: pairs whose centers are further apart than this never match. */
  readonly maxCenterDistance: number;
  /**
   * Hard gate: pairs overlapping less than this share of their union never match.
   *
   * Zero by default so matching is purely center-point based. A gate here would
   * turn a large shift into a missing element plus an unexpected element, which
   * reads as two unrelated defects instead of the one offset a developer can act
   * on. Raise it for dense surfaces where distinct elements crowd each other.
   */
  readonly minIou: number;
  /** When true, a text element can only match another text element. */
  readonly requireSameKind: boolean;
  /** Cost added when the two detector labels disagree. */
  readonly labelMismatchPenalty: number;
  readonly centerDistanceWeight: number;
  readonly iouWeight: number;
}

export const DEFAULT_MATCHING_OPTIONS: MatchingOptions = {
  maxCenterDistance: 48,
  minIou: 0,
  requireSameKind: true,
  labelMismatchPenalty: 0.35,
  centerDistanceWeight: 1,
  iouWeight: 1,
};

export interface CenterOffset {
  readonly dx: number;
  readonly dy: number;
}

export interface ElementPair {
  readonly designElement: DetectedElement;
  readonly liveElement: DetectedElement;
  /** Live center minus design center, so positive dx means "shifted right". */
  readonly centerOffset: CenterOffset;
  readonly centerDistance: number;
  readonly iou: number;
  readonly labelMatches: boolean;
  readonly cost: number;
}

export interface MatchResult {
  readonly pairs: readonly ElementPair[];
  readonly unmatchedDesign: readonly DetectedElement[];
  readonly unmatchedLive: readonly DetectedElement[];
}

interface Candidate extends ElementPair {
  readonly designIndex: number;
  readonly liveIndex: number;
}

/**
 * Pairs design elements with live elements by visual center point.
 *
 * The engine deliberately avoids an optimal assignment solver: a greedy pass over
 * candidates sorted by cost is easier to explain in a defect report ("this box was
 * matched to that box because it was the closest remaining one") and cannot
 * reorder its own output. Ties are broken by reading order and then by id, so the
 * result never depends on detector output order.
 */
export function matchElements(
  designElements: readonly DetectedElement[],
  liveElements: readonly DetectedElement[],
  options: MatchingOptions = DEFAULT_MATCHING_OPTIONS,
): MatchResult {
  assertOptions(options);

  const design = [...designElements].sort(compareElementsInReadingOrder);
  const live = [...liveElements].sort(compareElementsInReadingOrder);

  const candidates: Candidate[] = [];
  for (let designIndex = 0; designIndex < design.length; designIndex += 1) {
    const designElement = design[designIndex] as DetectedElement;
    for (let liveIndex = 0; liveIndex < live.length; liveIndex += 1) {
      const liveElement = live[liveIndex] as DetectedElement;
      const candidate = evaluateCandidate(
        designElement,
        liveElement,
        designIndex,
        liveIndex,
        options,
      );
      if (candidate !== null) candidates.push(candidate);
    }
  }

  candidates.sort(compareCandidates);

  const matchedDesign = new Set<number>();
  const matchedLive = new Set<number>();
  const pairs: ElementPair[] = [];
  for (const candidate of candidates) {
    if (matchedDesign.has(candidate.designIndex) || matchedLive.has(candidate.liveIndex)) continue;
    matchedDesign.add(candidate.designIndex);
    matchedLive.add(candidate.liveIndex);
    pairs.push(toPair(candidate));
  }

  pairs.sort((a, b) => compareElementsInReadingOrder(a.designElement, b.designElement));

  return {
    pairs,
    unmatchedDesign: design.filter((_, index) => !matchedDesign.has(index)),
    unmatchedLive: live.filter((_, index) => !matchedLive.has(index)),
  };
}

/** Looks a pair up by the design element's id. */
export function findPairByDesignId(
  result: MatchResult,
  designElementId: string,
): ElementPair | undefined {
  return result.pairs.find((pair) => pair.designElement.id === designElementId);
}

function evaluateCandidate(
  designElement: DetectedElement,
  liveElement: DetectedElement,
  designIndex: number,
  liveIndex: number,
  options: MatchingOptions,
): Candidate | null {
  if (options.requireSameKind && designElement.kind !== liveElement.kind) return null;

  const designCenter = boxCenter(designElement.box);
  const liveCenter = boxCenter(liveElement.box);
  const centerDistance = distance(designCenter, liveCenter);
  if (centerDistance > options.maxCenterDistance) return null;

  const iou = intersectionOverUnion(designElement.box, liveElement.box);
  if (iou < options.minIou) return null;

  const labelMatches = normalizeLabel(designElement.label) === normalizeLabel(liveElement.label);
  const cost =
    options.centerDistanceWeight * (centerDistance / options.maxCenterDistance) +
    options.iouWeight * (1 - iou) +
    (labelMatches ? 0 : options.labelMismatchPenalty);

  return {
    designElement,
    liveElement,
    designIndex,
    liveIndex,
    centerOffset: {
      dx: roundTo(liveCenter.x - designCenter.x, 4),
      dy: roundTo(liveCenter.y - designCenter.y, 4),
    },
    centerDistance: roundTo(centerDistance, 4),
    iou: roundTo(iou, 6),
    labelMatches,
    cost: roundTo(cost, 6),
  };
}

function toPair(candidate: Candidate): ElementPair {
  const { designIndex: _designIndex, liveIndex: _liveIndex, ...pair } = candidate;
  return pair;
}

function compareCandidates(a: Candidate, b: Candidate): number {
  if (a.cost !== b.cost) return a.cost - b.cost;
  if (a.centerDistance !== b.centerDistance) return a.centerDistance - b.centerDistance;
  if (a.designIndex !== b.designIndex) return a.designIndex - b.designIndex;
  if (a.liveIndex !== b.liveIndex) return a.liveIndex - b.liveIndex;
  return compareStrings(a.designElement.id, b.designElement.id);
}

function assertOptions(options: MatchingOptions): void {
  if (options.maxCenterDistance <= 0) {
    throw new RangeError('matchElements() requires maxCenterDistance > 0');
  }
  if (options.minIou < 0 || options.minIou > 1) {
    throw new RangeError('matchElements() requires minIou within [0, 1]');
  }
}
