/**
 * Curtain geometry.
 *
 * The curtain reveals the live layer up to a vertical line and the design layer
 * beyond it. A `clip-path` polygon is what makes the boundary a hard edge: with
 * opacity the two layers blend and a 1px offset is easy to miss, while a crisp seam
 * makes a misaligned edge jump as it crosses.
 */
export type CurtainOrientation = 'vertical' | 'horizontal';
export declare function clampPercent(value: number): number;
/** Polygon covering everything before the split. */
export declare function curtainClipPath(position: number, orientation: CurtainOrientation): string;
/** Polygon covering everything after the split, the complement of the above. */
export declare function curtainComplementClipPath(position: number, orientation: CurtainOrientation): string;
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
export declare function positionFromPointer(pointer: PointerPosition, bounds: ElementBounds, orientation: CurtainOrientation): number;
//# sourceMappingURL=clip-path.d.ts.map