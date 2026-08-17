export type OverlayMode = 'opacity' | 'curtain' | 'difference';

export interface OverlayState {
  readonly mode: OverlayMode;
  /** Live layer opacity in [0, 1], used in opacity mode. */
  readonly opacity: number;
  /** Curtain split position in [0, 100]. */
  readonly curtainPosition: number;
  readonly curtainOrientation: 'vertical' | 'horizontal';
  /** Whether the defect highlight overlays are shown. */
  readonly showHighlights: boolean;
}

export const DEFAULT_OVERLAY_STATE: OverlayState = {
  mode: 'opacity',
  opacity: 0.5,
  curtainPosition: 50,
  curtainOrientation: 'vertical',
  showHighlights: true,
};

export type OverlayAction =
  | { type: 'set-mode'; mode: OverlayMode }
  | { type: 'set-opacity'; opacity: number }
  | { type: 'set-curtain'; position: number }
  | { type: 'set-curtain-orientation'; orientation: 'vertical' | 'horizontal' }
  | { type: 'toggle-highlights' }
  | { type: 'reset' };

export function clampOpacity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Math.round(value * 1000) / 1000;
}

export function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case 'set-mode':
      return { ...state, mode: action.mode };
    case 'set-opacity':
      return { ...state, opacity: clampOpacity(action.opacity) };
    case 'set-curtain':
      return {
        ...state,
        curtainPosition: Math.max(0, Math.min(100, Math.round(action.position * 100) / 100)),
      };
    case 'set-curtain-orientation':
      return { ...state, curtainOrientation: action.orientation };
    case 'toggle-highlights':
      return { ...state, showHighlights: !state.showHighlights };
    case 'reset':
      return DEFAULT_OVERLAY_STATE;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

/**
 * CSS applied to the live layer for each review mode.
 *
 * - opacity: transparency makes a 1px shift read as a double image.
 * - curtain: clip-path is applied separately so this only carries opacity.
 * - difference: matching pixels go black; mismatches glow neon.
 */
export function liveLayerStyle(state: OverlayState): {
  opacity: number;
  mixBlendMode: 'normal' | 'difference';
} {
  switch (state.mode) {
    case 'opacity':
      return { opacity: state.opacity, mixBlendMode: 'normal' };
    case 'curtain':
      return { opacity: 1, mixBlendMode: 'normal' };
    case 'difference':
      return { opacity: 1, mixBlendMode: 'difference' };
    default: {
      const _exhaustive: never = state.mode;
      return _exhaustive;
    }
  }
}
