import { describe, expect, it } from 'vitest';
import { canonicalStringify, canonicalize } from './canonical-json.js';
import { normalizeReportDefects, summarizeDefects, toReportPair } from './report.js';
import { compareDefects, sortDefects } from '../defects/defect.js';
import type { Defect } from '../defects/defect.js';
import { matchElements } from '../matching/match-elements.js';
import { designElement, liveElement } from '../testing/factories.js';

const spacingDefect: Defect = {
  id: 'spacing:vertical:a->b',
  type: 'spacing',
  severity: 'error',
  message: 'gap drift',
  axis: 'vertical',
  designGapPx: 24,
  liveGapPx: 32,
  deltaPx: 8,
  tolerancePx: 2,
  betweenDesignElementIds: ['a', 'b'],
  betweenLiveElementIds: ['a', 'b'],
};

const weightDefect: Defect = {
  id: 'font-weight:label',
  type: 'font-weight',
  severity: 'warning',
  message: 'weight drift',
  expectedWeight: 700,
  actualWeight: 400,
  strokeDensity: 0.41,
  fontFamily: 'Mark Pro',
};

const missingDefect: Defect = {
  id: 'missing-element:icon',
  type: 'missing-element',
  severity: 'error',
  message: 'icon missing',
  kind: 'icon',
  label: 'search icon',
};

describe('canonicalize', () => {
  it('sorts object keys at every depth', () => {
    const value = canonicalize({ b: 1, a: { d: 2, c: [{ f: 3, e: 4 }] } });
    expect(JSON.stringify(value)).toBe('{"a":{"c":[{"e":4,"f":3}],"d":2},"b":1}');
  });

  it('produces identical bytes for objects built in a different order', () => {
    const first = canonicalStringify({ summary: { passed: true }, runId: 'r1' });
    const second = canonicalStringify({ runId: 'r1', summary: { passed: true } });
    expect(first).toBe(second);
  });

  it('drops undefined properties', () => {
    expect(canonicalStringify({ a: 1, b: undefined })).toBe('{\n  "a": 1\n}\n');
  });

  it('normalises negative zero', () => {
    expect(canonicalStringify({ delta: -0 })).toBe('{\n  "delta": 0\n}\n');
  });

  it('refuses to serialize values that cannot round-trip', () => {
    expect(() => canonicalize({ value: Number.NaN })).toThrow(TypeError);
    expect(() => canonicalize({ value: Number.POSITIVE_INFINITY })).toThrow(TypeError);
    expect(() => canonicalize(undefined)).toThrow(TypeError);
    expect(() => canonicalize({ callback: () => undefined })).toThrow(TypeError);
  });

  it('ends the document with a newline so files stay diff-friendly', () => {
    expect(canonicalStringify({ a: 1 }).endsWith('\n')).toBe(true);
  });
});

describe('defect ordering', () => {
  it('sorts errors before warnings, then by type, then by id', () => {
    const sorted = sortDefects([weightDefect, spacingDefect, missingDefect]);
    expect(sorted.map((defect) => defect.id)).toEqual([
      'missing-element:icon',
      'spacing:vertical:a->b',
      'font-weight:label',
    ]);
  });

  it('is a total order', () => {
    expect(compareDefects(spacingDefect, spacingDefect)).toBe(0);
    expect(compareDefects(spacingDefect, weightDefect)).toBeLessThan(0);
    expect(compareDefects(weightDefect, spacingDefect)).toBeGreaterThan(0);
  });

  it('does not mutate the input list', () => {
    const defects = [weightDefect, spacingDefect];
    normalizeReportDefects(defects);
    expect(defects[0]).toBe(weightDefect);
  });
});

describe('summarizeDefects', () => {
  it('counts by severity and type and fails the run on any error', () => {
    const summary = summarizeDefects([spacingDefect, weightDefect, missingDefect], {
      designElementCount: 10,
      liveElementCount: 9,
      matchedElementCount: 8,
    });

    expect(summary).toEqual({
      passed: false,
      totalDefects: 3,
      bySeverity: { error: 2, warning: 1 },
      byType: { spacing: 1, 'font-weight': 1, 'missing-element': 1 },
      designElementCount: 10,
      liveElementCount: 9,
      matchedElementCount: 8,
      matchRate: 0.8,
    });
  });

  it('passes when only warnings remain', () => {
    const summary = summarizeDefects([weightDefect], {
      designElementCount: 1,
      liveElementCount: 1,
      matchedElementCount: 1,
    });
    expect(summary.passed).toBe(true);
    expect(summary.matchRate).toBe(1);
  });

  it('treats an empty design surface as fully matched rather than dividing by zero', () => {
    const summary = summarizeDefects([], {
      designElementCount: 0,
      liveElementCount: 0,
      matchedElementCount: 0,
    });
    expect(summary.matchRate).toBe(1);
    expect(summary.passed).toBe(true);
  });
});

describe('toReportPair', () => {
  it('flattens a pair down to the ids and offsets the dashboard needs', () => {
    const match = matchElements(
      [designElement({ id: 'a', box: [0, 0, 10, 10] })],
      [liveElement({ id: 'a', box: [2, 0, 12, 10] })],
    );
    expect(toReportPair(match.pairs[0]!)).toEqual({
      designElementId: 'a',
      liveElementId: 'a',
      centerOffset: { dx: 2, dy: 0 },
      centerDistance: 2,
      iou: match.pairs[0]!.iou,
    });
  });
});
