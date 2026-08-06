import { describe, expect, it } from 'vitest';
import {
  boxArea,
  boxCenter,
  boxFromTuple,
  boxHeight,
  boxIntersection,
  boxToTuple,
  boxWidth,
  containsBox,
  createBox,
  distance,
  horizontalOverlap,
  inflateBox,
  intersectionOverUnion,
  scaleBox,
  toPixelBox,
  translateBox,
  verticalOverlap,
} from './box.js';

describe('box construction', () => {
  it('round-trips the OmniParser tuple format', () => {
    const box = boxFromTuple([10, 20, 110, 60]);
    expect(boxToTuple(box)).toEqual([10, 20, 110, 60]);
  });

  it('rejects inverted rectangles', () => {
    expect(() => createBox(10, 0, 5, 10)).toThrow(RangeError);
    expect(() => createBox(0, 10, 10, 5)).toThrow(RangeError);
  });

  it('rejects non-finite coordinates', () => {
    expect(() => createBox(0, 0, Number.NaN, 10)).toThrow(RangeError);
    expect(() => createBox(0, 0, Number.POSITIVE_INFINITY, 10)).toThrow(RangeError);
  });

  it('accepts degenerate zero-area boxes', () => {
    const box = createBox(5, 5, 5, 5);
    expect(boxArea(box)).toBe(0);
  });
});

describe('box measurements', () => {
  const box = createBox(10, 20, 110, 60);

  it('computes size and area', () => {
    expect(boxWidth(box)).toBe(100);
    expect(boxHeight(box)).toBe(40);
    expect(boxArea(box)).toBe(4000);
  });

  it('computes the center point used for element matching', () => {
    expect(boxCenter(box)).toEqual({ x: 60, y: 40 });
  });

  it('measures euclidean distance between centers', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });
});

describe('box overlap', () => {
  it('intersects overlapping boxes', () => {
    const intersection = boxIntersection(createBox(0, 0, 10, 10), createBox(5, 5, 15, 15));
    expect(intersection).toEqual({ xMin: 5, yMin: 5, xMax: 10, yMax: 10 });
  });

  it('returns null for disjoint and edge-touching boxes', () => {
    expect(boxIntersection(createBox(0, 0, 10, 10), createBox(20, 20, 30, 30))).toBeNull();
    expect(boxIntersection(createBox(0, 0, 10, 10), createBox(10, 0, 20, 10))).toBeNull();
  });

  it('computes IoU', () => {
    expect(intersectionOverUnion(createBox(0, 0, 10, 10), createBox(0, 0, 10, 10))).toBe(1);
    expect(intersectionOverUnion(createBox(0, 0, 10, 10), createBox(20, 0, 30, 10))).toBe(0);
    // 25 shared of 175 union.
    expect(intersectionOverUnion(createBox(0, 0, 10, 10), createBox(5, 5, 15, 15))).toBeCloseTo(
      25 / 175,
      10,
    );
  });

  it('projects overlap onto each axis', () => {
    const a = createBox(0, 0, 100, 20);
    const b = createBox(40, 30, 200, 50);
    expect(horizontalOverlap(a, b)).toBe(60);
    expect(verticalOverlap(a, b)).toBe(0);
  });

  it('detects containment', () => {
    const outer = createBox(0, 0, 100, 100);
    expect(containsBox(outer, createBox(10, 10, 20, 20))).toBe(true);
    expect(containsBox(outer, createBox(10, 10, 120, 20))).toBe(false);
    expect(containsBox(outer, outer)).toBe(true);
  });
});

describe('box transforms', () => {
  it('inflates and deflates', () => {
    expect(inflateBox(createBox(10, 10, 20, 20), 5)).toEqual({
      xMin: 5,
      yMin: 5,
      xMax: 25,
      yMax: 25,
    });
    expect(inflateBox(createBox(10, 10, 20, 20), -2)).toEqual({
      xMin: 12,
      yMin: 12,
      xMax: 18,
      yMax: 18,
    });
  });

  it('keeps a valid rectangle when deflated past its own size', () => {
    const collapsed = inflateBox(createBox(10, 10, 20, 20), -20);
    expect(collapsed.xMin).toBeLessThanOrEqual(collapsed.xMax);
    expect(collapsed.yMin).toBeLessThanOrEqual(collapsed.yMax);
  });

  it('snaps to whole pixels and clips to the image', () => {
    const box = toPixelBox(createBox(9.4, 19.6, 110.2, 60.1), { width: 100, height: 50 });
    expect(box).toEqual({ xMin: 9, yMin: 19, xMax: 100, yMax: 50 });
  });

  it('clips boxes that start outside the image', () => {
    const box = toPixelBox(createBox(-20, -30, -5, -10), { width: 100, height: 50 });
    expect(box).toEqual({ xMin: 0, yMin: 0, xMax: 0, yMax: 0 });
  });

  it('scales between surfaces of different densities', () => {
    const box = createBox(20, 40, 60, 80);
    expect(scaleBox(box, { width: 1440, height: 900 }, { width: 720, height: 450 })).toEqual({
      xMin: 10,
      yMin: 20,
      xMax: 30,
      yMax: 40,
    });
  });

  it('rejects scaling from a degenerate surface', () => {
    expect(() => scaleBox(createBox(0, 0, 1, 1), { width: 0, height: 10 }, { width: 5, height: 5 })).toThrow(
      RangeError,
    );
  });

  it('translates a crop-local box back into parent space', () => {
    expect(translateBox(createBox(0, 0, 10, 4), 100, 200)).toEqual({
      xMin: 100,
      yMin: 200,
      xMax: 110,
      yMax: 204,
    });
  });
});
