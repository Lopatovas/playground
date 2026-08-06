import { describe, expect, it } from 'vitest';
import { DEFAULT_SPACING_CHECK_OPTIONS, checkSpacing } from './spacing-check.js';
import { matchElements } from '../matching/match-elements.js';
import { designElement, liveElement } from '../testing/factories.js';
import type { ElementSpec } from '../testing/factories.js';

const HEADING: ElementSpec = { id: 'heading', box: [40, 40, 400, 100], kind: 'text', label: 'heading' };
const BODY: ElementSpec = { id: 'body', box: [40, 124, 400, 160], kind: 'text', label: 'body' };

describe('checkSpacing', () => {
  it('passes when the live gap matches the design gap', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING), liveElement(BODY)];
    const result = checkSpacing(design, matchElements(design, live));

    expect(result.comparisons).toHaveLength(1);
    expect(result.comparisons[0]).toMatchObject({
      axis: 'vertical',
      designGapPx: 24,
      liveGapPx: 24,
      deltaPx: 0,
      withinTolerance: true,
    });
    expect(result.defects).toHaveLength(0);
  });

  it('accepts drift inside the tolerance band', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING), liveElement({ ...BODY, box: [40, 126, 400, 162] })];
    const result = checkSpacing(design, matchElements(design, live));

    expect(result.comparisons[0]?.deltaPx).toBe(2);
    expect(result.defects).toHaveLength(0);
  });

  it('flags a padding defect once drift exceeds the tolerance', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING), liveElement({ ...BODY, box: [40, 132, 400, 168] })];
    const result = checkSpacing(design, matchElements(design, live));

    expect(result.defects).toHaveLength(1);
    const defect = result.defects[0];
    expect(defect).toMatchObject({
      type: 'spacing',
      severity: 'error',
      axis: 'vertical',
      designGapPx: 24,
      liveGapPx: 32,
      deltaPx: 8,
      tolerancePx: 2,
      betweenDesignElementIds: ['heading', 'body'],
      betweenLiveElementIds: ['heading', 'body'],
    });
    expect(defect?.message).toContain('design 24px, live 32px');
    expect(defect?.message).toContain('+8px');
  });

  it('reports collapsed spacing as a negative delta', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING), liveElement({ ...BODY, box: [40, 108, 400, 144] })];
    const result = checkSpacing(design, matchElements(design, live));

    expect(result.defects[0]).toMatchObject({ liveGapPx: 8, deltaPx: -16 });
    expect(result.defects[0]?.message).toContain('Missing vertical space');
  });

  it('measures the live gap between matched boxes even when an element was inserted', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [
      liveElement(HEADING),
      // A banner appears between the two, destroying the original adjacency.
      liveElement({ id: 'banner', box: [40, 108, 400, 140], kind: 'container', label: 'banner' }),
      liveElement({ ...BODY, box: [40, 164, 400, 200] }),
    ];
    const result = checkSpacing(design, matchElements(design, live));

    expect(result.comparisons[0]).toMatchObject({ designGapPx: 24, liveGapPx: 64, deltaPx: 40 });
    expect(result.defects).toHaveLength(1);
  });

  it('skips gaps whose endpoint never matched instead of inventing a measurement', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING)];
    const result = checkSpacing(design, matchElements(design, live));

    expect(result.comparisons).toHaveLength(0);
    expect(result.defects).toHaveLength(0);
    expect(result.skippedGaps).toHaveLength(1);
    expect(result.skippedGaps[0]).toMatchObject({ fromElementId: 'heading', toElementId: 'body' });
  });

  it('honours a custom tolerance', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING), liveElement({ ...BODY, box: [40, 130, 400, 166] })];
    const relaxed = checkSpacing(design, matchElements(design, live), {
      ...DEFAULT_SPACING_CHECK_OPTIONS,
      tolerancePx: 6,
    });
    expect(relaxed.defects).toHaveLength(0);
  });

  it('rejects a negative tolerance', () => {
    expect(() =>
      checkSpacing([], matchElements([], []), {
        ...DEFAULT_SPACING_CHECK_OPTIONS,
        tolerancePx: -1,
      }),
    ).toThrow(RangeError);
  });

  it('produces stable defect ids across runs', () => {
    const design = [designElement(HEADING), designElement(BODY)];
    const live = [liveElement(HEADING), liveElement({ ...BODY, box: [40, 140, 400, 176] })];
    const first = checkSpacing(design, matchElements(design, live));
    const second = checkSpacing([...design].reverse(), matchElements(design, live));
    expect(first.defects.map((defect) => defect.id)).toEqual(
      second.defects.map((defect) => defect.id),
    );
    expect(first.defects[0]?.id).toBe('spacing:vertical:heading->body');
  });
});
