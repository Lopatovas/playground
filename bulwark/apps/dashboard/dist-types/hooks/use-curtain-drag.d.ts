import { type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import type { CurtainOrientation } from '../lib/clip-path.js';
/**
 * Tracks pointer/touch movement over the overlay to drive the curtain split.
 *
 * Pointer capture keeps the line tracking when the cursor leaves the frame mid-drag,
 * which is the normal way a reviewer slides the seam across the whole composition.
 */
export declare function useCurtainDrag(
  orientation: CurtainOrientation,
  onChange: (position: number) => void,
): {
  readonly ref: RefObject<HTMLDivElement | null>;
  readonly dragging: boolean;
  readonly onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};
//# sourceMappingURL=use-curtain-drag.d.ts.map
