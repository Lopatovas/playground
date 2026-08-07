import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STRUCTURE_CHECK_OPTIONS,
  checkStructure,
  structureDefects,
} from './structure-check.js';
import { matchElements } from '../matching/match-elements.js';
import { designElement, liveElement } from '../testing/factories.js';
import type { ElementSpec } from '../testing/factories.js';

const CARD: ElementSpec = { id: 'card', box: [40, 40, 400, 200], kind: 'container', label: 'card' };
const ICON: ElementSpec = {
  id: 'search',
  box: [360, 56, 384, 80],
  kind: 'icon',
  label: 'search icon',
};

describe('checkStructure', () => {
  it('reports nothing when the page matches the design', () => {
    const match = matchElements([designElement(CARD)], [liveElement(CARD)]);
    const result = checkStructure(match);
    expect(structureDefects(result)).toHaveLength(0);
  });

  it('ignores sub-pixel drift inside the tolerance', () => {
    const match = matchElements(
      [designElement(CARD)],
      [liveElement({ ...CARD, box: [41, 41, 401, 201] })],
    );
    expect(checkStructure(match).positionDefects).toHaveLength(0);
  });

  it('flags a shifted element with signed offsets', () => {
    const match = matchElements(
      [designElement(CARD)],
      [liveElement({ ...CARD, box: [52, 36, 412, 196] })],
    );
    const [defect] = checkStructure(match).positionDefects;

    expect(defect).toMatchObject({
      type: 'position',
      severity: 'error',
      offsetXPx: 12,
      offsetYPx: -4,
      tolerancePx: 2,
    });
    expect(defect?.message).toContain('+12px horizontally');
    expect(defect?.message).toContain('-4px vertically');
    expect(defect?.designBox).toEqual({ xMin: 40, yMin: 40, xMax: 400, yMax: 200 });
    expect(defect?.liveBox).toEqual({ xMin: 52, yMin: 36, xMax: 412, yMax: 196 });
  });

  it('reports a design element with no live counterpart as missing', () => {
    const match = matchElements([designElement(CARD), designElement(ICON)], [liveElement(CARD)]);
    const result = checkStructure(match);

    expect(result.missingDefects).toHaveLength(1);
    expect(result.missingDefects[0]).toMatchObject({
      type: 'missing-element',
      severity: 'error',
      kind: 'icon',
      label: 'search icon',
      designElementId: 'search',
    });
  });

  it('reports an extra live element as a warning, not an error', () => {
    const match = matchElements([designElement(CARD)], [liveElement(CARD), liveElement(ICON)]);
    const result = checkStructure(match);

    expect(result.unexpectedDefects).toHaveLength(1);
    expect(result.unexpectedDefects[0]).toMatchObject({
      type: 'unexpected-element',
      severity: 'warning',
      liveElementId: 'search',
    });
  });

  it('can suppress extra live elements', () => {
    const match = matchElements([designElement(CARD)], [liveElement(CARD), liveElement(ICON)]);
    const result = checkStructure(match, {
      ...DEFAULT_STRUCTURE_CHECK_OPTIONS,
      reportUnexpectedElements: false,
    });
    expect(result.unexpectedDefects).toHaveLength(0);
  });

  it('rejects a negative tolerance', () => {
    expect(() =>
      checkStructure(matchElements([], []), {
        ...DEFAULT_STRUCTURE_CHECK_OPTIONS,
        centerTolerancePx: -2,
      }),
    ).toThrow(RangeError);
  });
});
