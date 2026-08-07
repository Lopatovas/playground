import { roundTo } from '../numeric.js';

/**
 * Absolute, inclusive-exclusive pixel rectangle in image space, matching the
 * `[xmin, ymin, xmax, ymax]` convention OmniParser returns.
 */
export interface BoundingBox {
  readonly xMin: number;
  readonly yMin: number;
  readonly xMax: number;
  readonly yMax: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Size {
  readonly width: number;
  readonly height: number;
}

export type BoxTuple = readonly [xMin: number, yMin: number, xMax: number, yMax: number];

export function createBox(xMin: number, yMin: number, xMax: number, yMax: number): BoundingBox {
  const box = { xMin, yMin, xMax, yMax };
  assertValidBox(box);
  return box;
}

export function boxFromTuple(tuple: BoxTuple): BoundingBox {
  return createBox(tuple[0], tuple[1], tuple[2], tuple[3]);
}

export function boxToTuple(box: BoundingBox): BoxTuple {
  return [box.xMin, box.yMin, box.xMax, box.yMax];
}

export function assertValidBox(box: BoundingBox): void {
  for (const [name, value] of Object.entries(box)) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`Bounding box field ${name} must be finite, received ${value}`);
    }
  }
  if (box.xMax < box.xMin || box.yMax < box.yMin) {
    throw new RangeError(
      `Bounding box must satisfy xMin <= xMax and yMin <= yMax, received ` +
        `[${box.xMin}, ${box.yMin}, ${box.xMax}, ${box.yMax}]`,
    );
  }
}

export function boxWidth(box: BoundingBox): number {
  return box.xMax - box.xMin;
}

export function boxHeight(box: BoundingBox): number {
  return box.yMax - box.yMin;
}

export function boxArea(box: BoundingBox): number {
  return boxWidth(box) * boxHeight(box);
}

export function boxCenter(box: BoundingBox): Point {
  return {
    x: (box.xMin + box.xMax) / 2,
    y: (box.yMin + box.yMax) / 2,
  };
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function boxIntersection(a: BoundingBox, b: BoundingBox): BoundingBox | null {
  const xMin = Math.max(a.xMin, b.xMin);
  const yMin = Math.max(a.yMin, b.yMin);
  const xMax = Math.min(a.xMax, b.xMax);
  const yMax = Math.min(a.yMax, b.yMax);
  if (xMax <= xMin || yMax <= yMin) return null;
  return { xMin, yMin, xMax, yMax };
}

export function intersectionOverUnion(a: BoundingBox, b: BoundingBox): number {
  const intersection = boxIntersection(a, b);
  if (intersection === null) return 0;
  const intersectionArea = boxArea(intersection);
  const unionArea = boxArea(a) + boxArea(b) - intersectionArea;
  if (unionArea <= 0) return 0;
  return intersectionArea / unionArea;
}

/** Overlap of the two boxes' projections onto the horizontal axis, in pixels. */
export function horizontalOverlap(a: BoundingBox, b: BoundingBox): number {
  return Math.max(0, Math.min(a.xMax, b.xMax) - Math.max(a.xMin, b.xMin));
}

/** Overlap of the two boxes' projections onto the vertical axis, in pixels. */
export function verticalOverlap(a: BoundingBox, b: BoundingBox): number {
  return Math.max(0, Math.min(a.yMax, b.yMax) - Math.max(a.yMin, b.yMin));
}

export function containsBox(outer: BoundingBox, inner: BoundingBox): boolean {
  return (
    inner.xMin >= outer.xMin &&
    inner.yMin >= outer.yMin &&
    inner.xMax <= outer.xMax &&
    inner.yMax <= outer.yMax
  );
}

/** Grows the box by `padding` on all sides. Negative padding shrinks it. */
export function inflateBox(box: BoundingBox, padding: number): BoundingBox {
  const xMin = box.xMin - padding;
  const yMin = box.yMin - padding;
  const xMax = box.xMax + padding;
  const yMax = box.yMax + padding;
  return createBox(
    Math.min(xMin, xMax),
    Math.min(yMin, yMax),
    Math.max(xMin, xMax),
    Math.max(yMin, yMax),
  );
}

/**
 * Snaps a box to whole pixels and clips it to the image bounds, which is what a
 * cropper needs before it can slice a raster.
 */
export function toPixelBox(box: BoundingBox, size: Size): BoundingBox {
  const xMin = clampToRange(Math.floor(box.xMin), 0, size.width);
  const yMin = clampToRange(Math.floor(box.yMin), 0, size.height);
  const xMax = clampToRange(Math.ceil(box.xMax), xMin, size.width);
  const yMax = clampToRange(Math.ceil(box.yMax), yMin, size.height);
  return { xMin, yMin, xMax, yMax };
}

/** Translates a box measured in `from` image space into `to` image space. */
export function scaleBox(box: BoundingBox, from: Size, to: Size): BoundingBox {
  if (from.width <= 0 || from.height <= 0) {
    throw new RangeError('scaleBox() requires a positive source size');
  }
  const scaleX = to.width / from.width;
  const scaleY = to.height / from.height;
  return createBox(
    roundTo(box.xMin * scaleX, 4),
    roundTo(box.yMin * scaleY, 4),
    roundTo(box.xMax * scaleX, 4),
    roundTo(box.yMax * scaleY, 4),
  );
}

/** Offsets a box that was measured inside a crop back into the parent image. */
export function translateBox(box: BoundingBox, dx: number, dy: number): BoundingBox {
  return createBox(box.xMin + dx, box.yMin + dy, box.xMax + dx, box.yMax + dy);
}

function clampToRange(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
