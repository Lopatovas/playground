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
export declare function boxToPercentStyle(box: DashboardBox, surface: SurfaceSize): BoxStyle;
/**
 * Scale that fits a surface inside the available area without cropping it.
 *
 * Capped at 1 so a small design is never upscaled: enlarging the design would blur
 * the very edges the reviewer is inspecting.
 */
export declare function fitScale(surface: SurfaceSize, available: SurfaceSize): number;
/**
 * The frame both layers are drawn in.
 *
 * A design export and a screenshot rarely have identical dimensions, so the frame is
 * the union of the two. Stretching one to match the other would misrepresent the
 * geometry the report measured.
 */
export declare function overlayFrameSize(design: SurfaceSize, live: SurfaceSize): SurfaceSize;
//# sourceMappingURL=geometry.d.ts.map