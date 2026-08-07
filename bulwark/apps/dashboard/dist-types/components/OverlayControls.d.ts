import type { OverlayState } from '../lib/overlay-state.js';
import type { OverlayAction } from '../lib/overlay-state.js';
export interface OverlayControlsProps {
  readonly state: OverlayState;
  readonly dispatch: (action: OverlayAction) => void;
}
export declare function OverlayControls({
  state,
  dispatch,
}: OverlayControlsProps): import('react').JSX.Element;
//# sourceMappingURL=OverlayControls.d.ts.map
