import type { OverlayMode, OverlayState } from '../lib/overlay-state.js';
import type { OverlayAction } from '../lib/overlay-state.js';

export interface OverlayControlsProps {
  readonly state: OverlayState;
  readonly dispatch: (action: OverlayAction) => void;
}

const MODES: readonly { mode: OverlayMode; label: string; hint: string }[] = [
  { mode: 'opacity', label: 'Opacity', hint: 'Double-image drift' },
  { mode: 'curtain', label: 'Curtain', hint: 'Slide a hard seam' },
  { mode: 'difference', label: 'Difference', hint: 'Matching pixels go black' },
];

export function OverlayControls({ state, dispatch }: OverlayControlsProps) {
  return (
    <div className="overlay-controls" role="toolbar" aria-label="Overlay controls">
      <div className="overlay-controls__modes" role="group" aria-label="Review mode">
        {MODES.map((entry) => (
          <button
            key={entry.mode}
            type="button"
            className={`mode-button${state.mode === entry.mode ? ' mode-button--active' : ''}`}
            aria-pressed={state.mode === entry.mode}
            title={entry.hint}
            onClick={() => dispatch({ type: 'set-mode', mode: entry.mode })}
          >
            <span className="mode-button__label">{entry.label}</span>
            <span className="mode-button__hint">{entry.hint}</span>
          </button>
        ))}
      </div>

      {state.mode === 'opacity' ? (
        <label className="overlay-controls__slider">
          <span>Live opacity {Math.round(state.opacity * 100)}%</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(state.opacity * 100)}
            onChange={(event) =>
              dispatch({ type: 'set-opacity', opacity: Number(event.target.value) / 100 })
            }
          />
        </label>
      ) : null}

      {state.mode === 'curtain' ? (
        <>
          <label className="overlay-controls__slider">
            <span>Split {Math.round(state.curtainPosition)}%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(state.curtainPosition)}
              onChange={(event) =>
                dispatch({ type: 'set-curtain', position: Number(event.target.value) })
              }
            />
          </label>
          <div className="overlay-controls__orient" role="group" aria-label="Curtain orientation">
            <button
              type="button"
              aria-pressed={state.curtainOrientation === 'vertical'}
              onClick={() => dispatch({ type: 'set-curtain-orientation', orientation: 'vertical' })}
            >
              Vertical
            </button>
            <button
              type="button"
              aria-pressed={state.curtainOrientation === 'horizontal'}
              onClick={() =>
                dispatch({ type: 'set-curtain-orientation', orientation: 'horizontal' })
              }
            >
              Horizontal
            </button>
          </div>
        </>
      ) : null}

      <button
        type="button"
        className="overlay-controls__toggle"
        aria-pressed={state.showHighlights}
        onClick={() => dispatch({ type: 'toggle-highlights' })}
      >
        {state.showHighlights ? 'Hide highlights' : 'Show highlights'}
      </button>
    </div>
  );
}
