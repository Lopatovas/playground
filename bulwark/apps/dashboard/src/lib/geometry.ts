import type { DashboardBox } from './report-schema.js';

export interface SurfaceSize {
  readonly width: number;
  readonly height: number;
}

export interface BoxStyle {
  readonly left: string;
  readonly top: string;
  readonly width: string;
  readonly height: string;
}

/**
 * Positions a defect highlight as percentages of its surface.
 *
 * Percentages rather than pixels: the overlay scales to fit the window, and a
 * highlight expressed in source pixels would drift away from the pixels it describes
 * as soon as the layout changed size.
 */
export function boxToPercentStyle(box: DashboardBox, surface: SurfaceSize): BoxStyle {
  if (surface.width <= 0 || surface.height <= 0) {
    throw new RangeError('boxToPercentStyle() requires a surface with positive dimensions');
  }

  const left = (box.xMin / surface.width) * 100;
  const top = (box.yMin / surface.height) * 100;
  const width = ((box.xMax - box.xMin) / surface.width) * 100;
  const height = ((box.yMax - box.yMin) / surface.height) * 100;

  return {
    left: toPercent(left),
    top: toPercent(top),
    width: toPercent(Math.max(width, 0)),
    height: toPercent(Math.max(height, 0)),
  };
}

/**
 * Scale that fits a surface inside the available area without cropping it.
 *
 * Capped at 1 so a small design is never upscaled: enlarging the design would blur
 * the very edges the reviewer is inspecting.
 */
export function fitScale(surface: SurfaceSize, available: SurfaceSize): number {
  if (surface.width <= 0 || surface.height <= 0) return 1;
  if (available.width <= 0 || available.height <= 0) return 1;
  return Math.min(1, available.width / surface.width, available.height / surface.height);
}

/**
 * The frame both layers are drawn in.
 *
 * A design export and a screenshot rarely have identical dimensions, so the frame is
 * the union of the two. Stretching one to match the other would misrepresent the
 * geometry the report measured.
 */
export function overlayFrameSize(design: SurfaceSize, live: SurfaceSize): SurfaceSize {
  return {
    width: Math.max(design.width, live.width),
    height: Math.max(design.height, live.height),
  };
}

function toPercent(value: number): string {
  return `${Math.round(value * 1000) / 1000}%`;
}
