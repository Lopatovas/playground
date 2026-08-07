import { describe, expect, it } from 'vitest';
import { DEFAULT_MATCHING_OPTIONS, findPairByDesignId, matchElements } from './match-elements.js';
import { designElement, liveElement, shifted } from '../testing/factories.js';
import type { ElementSpec } from '../testing/factories.js';

const HEADING: ElementSpec = {
  id: 'heading',
  box: [40, 40, 400, 80],
  kind: 'text',
  label: 'heading',
};
const SUBTITLE: ElementSpec = {
  id: 'subtitle',
  box: [40, 104, 360, 128],
  kind: 'text',
  label: 'subtitle',
};
const CTA: ElementSpec = {
  id: 'cta',
  box: [40, 160, 200, 208],
  kind: 'container',
  label: 'button',
};

describe('matchElements', () => {
  it('pairs elements that sit in the same place', () => {
    const result = matchElements(
      [designElement(HEADING), designElement(SUBTITLE)],
      [liveElement(HEADING), liveElement(SUBTITLE)],
    );

    expect(result.pairs).toHaveLength(2);
    expect(result.unmatchedDesign).toHaveLength(0);
    expect(result.unmatchedLive).toHaveLength(0);
    expect(result.pairs.map((pair) => pair.designElement.id)).toEqual(['heading', 'subtitle']);
    expect(result.pairs.every((pair) => pair.centerDistance === 0)).toBe(true);
    expect(result.pairs.every((pair) => pair.iou === 1)).toBe(true);
  });

  it('reports the live offset with sign, so drift direction is readable', () => {
    const result = matchElements(
      [designElement(HEADING)],
      [liveElement({ ...HEADING, box: [46, 34, 406, 74] })],
    );

    const pair = findPairByDesignId(result, 'heading');
    expect(pair?.centerOffset).toEqual({ dx: 6, dy: -6 });
    expect(pair?.centerDistance).toBeCloseTo(Math.hypot(6, 6), 3);
  });

  it('still pairs an element that shifted clear of its original box', () => {
    // A gap-inducing regression can push an element off its design position
    // entirely. Reporting one offset is more actionable than reporting a missing
    // element next to an unexpected one.
    const result = matchElements(
      [designElement(SUBTITLE)],
      [liveElement({ ...SUBTITLE, box: [40, 144, 360, 168] })],
    );

    expect(result.pairs).toHaveLength(1);
    expect(result.pairs[0]?.iou).toBe(0);
    expect(result.pairs[0]?.centerOffset).toEqual({ dx: 0, dy: 40 });
  });

  it('applies an overlap gate when a project opts into one', () => {
    const result = matchElements(
      [designElement(SUBTITLE)],
      [liveElement({ ...SUBTITLE, box: [40, 144, 360, 168] })],
      { ...DEFAULT_MATCHING_OPTIONS, minIou: 0.2 },
    );
    expect(result.pairs).toHaveLength(0);
  });

  it('leaves an element unmatched when it drifted past the gate', () => {
    const result = matchElements([designElement(HEADING)], [liveElement(shifted(HEADING, 0, 400))]);

    expect(result.pairs).toHaveLength(0);
    expect(result.unmatchedDesign.map((item) => item.id)).toEqual(['heading']);
    expect(result.unmatchedLive.map((item) => item.id)).toEqual(['heading']);
  });

  it('does not match across element kinds by default', () => {
    const result = matchElements(
      [designElement({ ...CTA, kind: 'container' })],
      [liveElement({ ...CTA, kind: 'text' })],
    );
    expect(result.pairs).toHaveLength(0);
  });

  it('matches across kinds when the caller allows it', () => {
    const result = matchElements(
      [designElement({ ...CTA, kind: 'container' })],
      [liveElement({ ...CTA, kind: 'text' })],
      { ...DEFAULT_MATCHING_OPTIONS, requireSameKind: false },
    );
    expect(result.pairs).toHaveLength(1);
  });

  it('assigns each element at most once, preferring the cheaper pairing', () => {
    const design = [designElement(HEADING), designElement(SUBTITLE)];
    // One live element sits between the two design elements and would be the
    // nearest candidate for both.
    const live = [
      liveElement({ id: 'live-a', box: [40, 42, 400, 82], kind: 'text', label: 'heading' }),
      liveElement({ id: 'live-b', box: [40, 106, 360, 130], kind: 'text', label: 'subtitle' }),
    ];

    const result = matchElements(design, live);
    expect(result.pairs).toHaveLength(2);
    expect(result.pairs.map((pair) => [pair.designElement.id, pair.liveElement.id])).toEqual([
      ['heading', 'live-a'],
      ['subtitle', 'live-b'],
    ]);
  });

  it('prefers the label-matching candidate when geometry is ambiguous', () => {
    const design = [
      designElement({
        id: 'search',
        box: [100, 100, 124, 124],
        kind: 'icon',
        label: 'search icon',
      }),
    ];
    const live = [
      liveElement({ id: 'icon-a', box: [102, 100, 126, 124], kind: 'icon', label: 'menu icon' }),
      liveElement({ id: 'icon-b', box: [104, 100, 128, 124], kind: 'icon', label: 'Search Icon' }),
    ];

    const result = matchElements(design, live);
    expect(result.pairs[0]?.liveElement.id).toBe('icon-b');
    expect(result.pairs[0]?.labelMatches).toBe(true);
  });

  it('is independent of detector output order', () => {
    const design = [designElement(HEADING), designElement(SUBTITLE), designElement(CTA)];
    const live = [liveElement(HEADING), liveElement(SUBTITLE), liveElement(CTA)];

    const forward = matchElements(design, live);
    const reversed = matchElements([...design].reverse(), [...live].reverse());

    expect(forward.pairs.map((pair) => [pair.designElement.id, pair.liveElement.id])).toEqual(
      reversed.pairs.map((pair) => [pair.designElement.id, pair.liveElement.id]),
    );
  });

  it('handles empty surfaces', () => {
    expect(matchElements([], []).pairs).toHaveLength(0);
    expect(matchElements([designElement(HEADING)], []).unmatchedDesign).toHaveLength(1);
    expect(matchElements([], [liveElement(HEADING)]).unmatchedLive).toHaveLength(1);
  });

  it('rejects nonsensical options', () => {
    expect(() =>
      matchElements([], [], { ...DEFAULT_MATCHING_OPTIONS, maxCenterDistance: 0 }),
    ).toThrow(RangeError);
    expect(() => matchElements([], [], { ...DEFAULT_MATCHING_OPTIONS, minIou: 1.5 })).toThrow(
      RangeError,
    );
  });
});
