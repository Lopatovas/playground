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
export declare const DEFAULT_OVERLAY_STATE: OverlayState;
export type OverlayAction =
  | {
      type: 'set-mode';
      mode: OverlayMode;
    }
  | {
      type: 'set-opacity';
      opacity: number;
    }
  | {
      type: 'set-curtain';
      position: number;
    }
  | {
      type: 'set-curtain-orientation';
      orientation: 'vertical' | 'horizontal';
    }
  | {
      type: 'toggle-highlights';
    }
  | {
      type: 'reset';
    };
export declare function clampOpacity(value: number): number;
export declare function overlayReducer(state: OverlayState, action: OverlayAction): OverlayState;
/**
 * CSS applied to the live layer for each review mode.
 *
 * - opacity: transparency makes a 1px shift read as a double image.
 * - curtain: clip-path is applied separately so this only carries opacity.
 * - difference: matching pixels go black; mismatches glow neon.
 */
export declare function liveLayerStyle(state: OverlayState): {
  opacity: number;
  mixBlendMode: 'normal' | 'difference';
};
//# sourceMappingURL=overlay-state.d.ts.map
