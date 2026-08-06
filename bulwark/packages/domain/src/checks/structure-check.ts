import type { MatchResult } from '../matching/match-elements.js';
import type {
  Defect,
  MissingElementDefect,
  PositionDefect,
  UnexpectedElementDefect,
} from '../defects/defect.js';
import { roundTo } from '../numeric.js';

export interface StructureCheckOptions {
  /** How far a matched element's center may drift before it is a defect. */
  readonly centerTolerancePx: number;
  /** Report live elements that have no design counterpart. */
  readonly reportUnexpectedElements: boolean;
}

export const DEFAULT_STRUCTURE_CHECK_OPTIONS: StructureCheckOptions = {
  centerTolerancePx: 2,
  reportUnexpectedElements: true,
};

export interface StructureCheckResult {
  readonly positionDefects: readonly PositionDefect[];
  readonly missingDefects: readonly MissingElementDefect[];
  readonly unexpectedDefects: readonly UnexpectedElementDefect[];
}

/**
 * Turns the matching outcome into defects: elements that drifted, elements the
 * design has but the page does not, and elements the page adds on its own.
 */
export function checkStructure(
  match: MatchResult,
  options: StructureCheckOptions = DEFAULT_STRUCTURE_CHECK_OPTIONS,
): StructureCheckResult {
  if (options.centerTolerancePx < 0) {
    throw new RangeError('checkStructure() requires a non-negative centerTolerancePx');
  }

  const positionDefects: PositionDefect[] = [];
  for (const pair of match.pairs) {
    const { dx, dy } = pair.centerOffset;
    if (Math.abs(dx) <= options.centerTolerancePx && Math.abs(dy) <= options.centerTolerancePx) {
      continue;
    }
    positionDefects.push({
      id: `position:${pair.designElement.id}`,
      type: 'position',
      severity: 'error',
      message:
        `"${pair.designElement.label}" is offset by ${formatSigned(dx)}px horizontally and ` +
        `${formatSigned(dy)}px vertically (tolerance ±${options.centerTolerancePx}px)`,
      offsetXPx: dx,
      offsetYPx: dy,
      distancePx: roundTo(pair.centerDistance, 4),
      tolerancePx: options.centerTolerancePx,
      designBox: pair.designElement.box,
      liveBox: pair.liveElement.box,
      designElementId: pair.designElement.id,
      liveElementId: pair.liveElement.id,
    });
  }

  const missingDefects: MissingElementDefect[] = match.unmatchedDesign.map((element) => ({
    id: `missing-element:${element.id}`,
    type: 'missing-element',
    severity: 'error',
    message: `Design element "${element.label}" (${element.kind}) has no counterpart in the live page`,
    kind: element.kind,
    label: element.label,
    designBox: element.box,
    designElementId: element.id,
  }));

  const unexpectedDefects: UnexpectedElementDefect[] = options.reportUnexpectedElements
    ? match.unmatchedLive.map((element) => ({
        id: `unexpected-element:${element.id}`,
        type: 'unexpected-element',
        severity: 'warning',
        message: `Live element "${element.label}" (${element.kind}) is not present in the design`,
        kind: element.kind,
        label: element.label,
        liveBox: element.box,
        liveElementId: element.id,
      }))
    : [];

  return { positionDefects, missingDefects, unexpectedDefects };
}

export function structureDefects(result: StructureCheckResult): readonly Defect[] {
  return [...result.missingDefects, ...result.unexpectedDefects, ...result.positionDefects];
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}
