import { describe, expect, it } from 'vitest';
import { createBox } from '@bulwark/domain';
import {
  refineDesignBoxesForTextLeaf,
  selectPageTextBox,
} from './typography-measurer.js';

describe('refineDesignBoxesForTextLeaf', () => {
  it('leaves boxes alone when the DOM leaf fills the vision box', () => {
    const box = createBox(10, 20, 110, 60);
    const refined = refineDesignBoxesForTextLeaf({
      designSourceBox: box,
      designComparisonBox: box,
      liveVisionBox: box,
      liveDomBox: box,
    });
    expect(refined.sourceBox).toEqual(box);
    expect(refined.comparisonBox).toEqual(box);
  });

  it('projects a tighter live text leaf onto the design box', () => {
    const liveVision = createBox(0, 0, 200, 48);
    const liveDom = createBox(20, 12, 180, 36);
    const designSource = createBox(100, 200, 300, 248);
    const designComparison = createBox(100, 200, 300, 248);

    const refined = refineDesignBoxesForTextLeaf({
      designSourceBox: designSource,
      designComparisonBox: designComparison,
      liveVisionBox: liveVision,
      liveDomBox: liveDom,
    });

    expect(refined.sourceBox).toEqual(createBox(120, 212, 280, 236));
    expect(refined.comparisonBox).toEqual(createBox(120, 212, 280, 236));
  });
});

describe('selectPageTextBox', () => {
  it('returns null when no runs overlap the detector box', () => {
    const detector = createBox(40, 100, 200, 140);
    expect(
      selectPageTextBox(detector, [{ box: createBox(400, 400, 480, 420), text: 'Elsewhere' }], 'Hi'),
    ).toBeNull();
  });

  it('prefers a tight OCR box inside chrome-heavy detector bounds', () => {
    const chrome = createBox(40, 100, 240, 160);
    const label = createBox(60, 118, 200, 142);
    const picked = selectPageTextBox(
      chrome,
      [
        { box: label, text: 'Sign in' },
        { box: createBox(300, 100, 360, 120), text: 'Other' },
      ],
      'Sign in',
    );
    expect(picked).toEqual(label);
  });

  it('prefers an OCR box that covers a partial detector crop', () => {
    const partial = createBox(80, 100, 140, 130);
    const fullWord = createBox(60, 98, 200, 132);
    const picked = selectPageTextBox(
      partial,
      [{ box: fullWord, text: 'ShipFaster' }],
      'ShipFaster',
    );
    expect(picked).toEqual(fullWord);
  });
});
