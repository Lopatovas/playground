import { describe, expect, it } from 'vitest';
import { DEFAULT_GAP_GRAPH_OPTIONS, axisGap, buildGapGraph } from './gap-graph.js';
import { createBox } from '../geometry/box.js';
import { designElement } from '../testing/factories.js';

describe('axisGap', () => {
  it('measures the blueprint example: box ending at 100, next starting at 124', () => {
    const first = createBox(0, 40, 200, 100);
    const second = createBox(0, 124, 200, 160);
    expect(axisGap(first, second, 'vertical')).toBe(24);
  });

  it('returns a negative gap when the boxes overlap', () => {
    expect(axisGap(createBox(0, 0, 100, 50), createBox(0, 40, 100, 90), 'vertical')).toBe(-10);
  });

  it('measures horizontal gutters', () => {
    expect(axisGap(createBox(0, 0, 100, 50), createBox(132, 0, 232, 50), 'horizontal')).toBe(32);
  });
});

describe('buildGapGraph', () => {
  it('links a vertical stack to its immediate neighbour only', () => {
    const gaps = buildGapGraph([
      designElement({ id: 'a', box: [40, 40, 400, 80] }),
      designElement({ id: 'b', box: [40, 104, 400, 128] }),
      designElement({ id: 'c', box: [40, 152, 400, 176] }),
    ]);

    expect(gaps.filter((gap) => gap.axis === 'vertical')).toEqual([
      {
        axis: 'vertical',
        fromElementId: 'a',
        toElementId: 'b',
        gapPx: 24,
        crossAxisOverlapPx: 360,
      },
      {
        axis: 'vertical',
        fromElementId: 'b',
        toElementId: 'c',
        gapPx: 24,
        crossAxisOverlapPx: 360,
      },
    ]);
  });

  it('links a row horizontally', () => {
    const gaps = buildGapGraph([
      designElement({ id: 'left', box: [40, 40, 140, 80] }),
      designElement({ id: 'right', box: [172, 40, 272, 80] }),
    ]);

    expect(gaps).toEqual([
      {
        axis: 'horizontal',
        fromElementId: 'left',
        toElementId: 'right',
        gapPx: 32,
        crossAxisOverlapPx: 40,
      },
    ]);
  });

  it('ignores elements that do not line up on the cross axis', () => {
    const gaps = buildGapGraph([
      designElement({ id: 'sidebar-item', box: [0, 40, 60, 80] }),
      designElement({ id: 'footer-button', box: [900, 700, 1000, 740] }),
    ]);
    expect(gaps).toEqual([]);
  });

  it('produces no gap for a child nested inside its container', () => {
    // Forward-only adjacency: neither box begins after the other ends.
    const gaps = buildGapGraph([
      designElement({ id: 'card', box: [40, 40, 400, 200] }),
      designElement({ id: 'card-label', box: [56, 56, 200, 80] }),
    ]);
    expect(gaps).toEqual([]);
  });

  it('measures a gap between two children of the same container', () => {
    const gaps = buildGapGraph([
      designElement({ id: 'card-title', box: [56, 56, 380, 84] }),
      designElement({ id: 'card-body', box: [56, 100, 380, 160] }),
    ]);
    expect(gaps.map((gap) => `${gap.fromElementId}->${gap.toElementId}=${gap.gapPx}`)).toEqual([
      'card-title->card-body=16',
    ]);
  });

  it('drops neighbours beyond the distance ceiling', () => {
    const gaps = buildGapGraph(
      [
        designElement({ id: 'a', box: [40, 0, 400, 40] }),
        designElement({ id: 'b', box: [40, 500, 400, 540] }),
      ],
      { ...DEFAULT_GAP_GRAPH_OPTIONS, maxGapPx: 100 },
    );
    expect(gaps).toEqual([]);
  });

  it('produces the same graph regardless of input order', () => {
    const elements = [
      designElement({ id: 'a', box: [40, 40, 400, 80] }),
      designElement({ id: 'b', box: [40, 104, 400, 128] }),
      designElement({ id: 'c', box: [40, 152, 400, 176] }),
    ];
    expect(buildGapGraph(elements)).toEqual(buildGapGraph([...elements].reverse()));
  });

  it('rejects invalid options', () => {
    expect(() => buildGapGraph([], { ...DEFAULT_GAP_GRAPH_OPTIONS, maxGapPx: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      buildGapGraph([], { ...DEFAULT_GAP_GRAPH_OPTIONS, minCrossAxisOverlapRatio: 2 }),
    ).toThrow(RangeError);
  });
});
