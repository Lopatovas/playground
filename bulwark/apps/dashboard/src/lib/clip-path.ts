/**
 * Curtain geometry.
 *
 * The curtain reveals the live layer up to a vertical line and the design layer
 * beyond it. A `clip-path` polygon is what makes the boundary a hard edge: with
 * opacity the two layers blend and a 1px offset is easy to miss, while a crisp seam
 * makes a misaligned edge jump as it crosses.
 */

export type CurtainOrientation = 'vertical' | 'horizontal';

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value * 100) / 100;
}

/** Polygon covering everything before the split. */
export function curtainClipPath(position: number, orientation: CurtainOrientation): string {
  const at = clampPercent(position);
  return orientation === 'vertical'
    ? `polygon(0% 0%, ${at}% 0%, ${at}% 100%, 0% 100%)`
    : `polygon(0% 0%, 100% 0%, 100% ${at}%, 0% ${at}%)`;
}

/** Polygon covering everything after the split, the complement of the above. */
export function curtainComplementClipPath(
  position: number,
  orientation: CurtainOrientation,
): string {
  const at = clampPercent(position);
  return orientation === 'vertical'
    ? `polygon(${at}% 0%, 100% 0%, 100% 100%, ${at}% 100%)`
    : `polygon(0% ${at}%, 100% ${at}%, 100% 100%, 0% 100%)`;
}

export interface PointerPosition {
  readonly clientX: number;
  readonly clientY: number;
}

export interface ElementBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Converts a pointer position into a curtain percentage along the split axis. */
export function positionFromPointer(
  pointer: PointerPosition,
  bounds: ElementBounds,
  orientation: CurtainOrientation,
): number {
  if (orientation === 'vertical') {
    if (bounds.width <= 0) return 0;
    return clampPercent(((pointer.clientX - bounds.left) / bounds.width) * 100);
  }
  if (bounds.height <= 0) return 0;
  return clampPercent(((pointer.clientY - bounds.top) / bounds.height) * 100);
}
