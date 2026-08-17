import type { CSSProperties } from 'react';
import type { DashboardBox, DashboardDefect, DashboardReport } from '../lib/report-schema.js';
import { curtainClipPath, curtainComplementClipPath } from '../lib/clip-path.js';
import { boxToPercentStyle, overlayFrameSize } from '../lib/geometry.js';
import { liveLayerStyle } from '../lib/overlay-state.js';
import type { OverlayState } from '../lib/overlay-state.js';
import { artifactUrl } from '../lib/urls.js';
import { useCurtainDrag } from '../hooks/use-curtain-drag.js';

export interface OverlayCanvasProps {
  readonly report: DashboardReport;
  readonly artifactsBase: string;
  readonly overlay: OverlayState;
  readonly selectedDefectId: string | null;
  readonly onCurtainChange: (position: number) => void;
  readonly onSelectDefect: (id: string | null) => void;
}

export function OverlayCanvas({
  report,
  artifactsBase,
  overlay,
  selectedDefectId,
  onCurtainChange,
  onSelectDefect,
}: OverlayCanvasProps) {
  const frame = overlayFrameSize(report.surfaces.design, report.surfaces.live);
  const designSrc = artifactUrl(report.surfaces.design.imagePath, artifactsBase);
  const liveSrc = artifactUrl(report.surfaces.live.imagePath, artifactsBase);
  const liveStyle = liveLayerStyle(overlay);
  const curtain = useCurtainDrag(overlay.curtainOrientation, onCurtainChange);

  const selected = report.defects.find((defect) => defect.id === selectedDefectId) ?? null;
  const hasSelection = selected !== null;

  return (
    <div
      className={`overlay-canvas${curtain.dragging ? ' overlay-canvas--dragging' : ''}${hasSelection ? ' overlay-canvas--has-selection' : ''}`}
      role="img"
      aria-label="Design and live overlay"
    >
      <div
        className="overlay-canvas__frame"
        ref={curtain.ref}
        onPointerDown={overlay.mode === 'curtain' ? curtain.onPointerDown : undefined}
        style={
          {
            '--frame-w': frame.width,
            '--frame-h': frame.height,
          } as CSSProperties
        }
      >
        <img
          className="overlay-layer overlay-layer--design"
          src={designSrc}
          alt="Design export"
          draggable={false}
          style={
            overlay.mode === 'curtain'
              ? {
                  clipPath: curtainComplementClipPath(
                    overlay.curtainPosition,
                    overlay.curtainOrientation,
                  ),
                }
              : undefined
          }
        />
        <img
          className="overlay-layer overlay-layer--live"
          src={liveSrc}
          alt="Live implementation"
          draggable={false}
          style={{
            opacity: liveStyle.opacity,
            mixBlendMode: liveStyle.mixBlendMode,
            ...(overlay.mode === 'curtain'
              ? {
                  clipPath: curtainClipPath(overlay.curtainPosition, overlay.curtainOrientation),
                }
              : {}),
          }}
        />

        {overlay.mode === 'curtain' ? (
          <div
            className={`curtain-seam curtain-seam--${overlay.curtainOrientation}`}
            style={
              overlay.curtainOrientation === 'vertical'
                ? { left: `${overlay.curtainPosition}%` }
                : { top: `${overlay.curtainPosition}%` }
            }
            aria-hidden="true"
          />
        ) : null}

        {overlay.showHighlights
          ? report.defects.map((defect) => {
              if (defect.id === selectedDefectId) return null;
              return (
                <DefectHighlight
                  key={defect.id}
                  defect={defect}
                  surface={report.surfaces.design}
                  fallbackSurface={report.surfaces.live}
                  selected={false}
                  onSelect={onSelectDefect}
                />
              );
            })
          : null}

        {selected !== null ? (
          <SelectedDefectFocus
            defect={selected}
            designSurface={report.surfaces.design}
            liveSurface={report.surfaces.live}
            onSelect={onSelectDefect}
          />
        ) : null}
      </div>
    </div>
  );
}

interface DefectHighlightProps {
  readonly defect: DashboardDefect;
  readonly surface: { width: number; height: number };
  readonly fallbackSurface: { width: number; height: number };
  readonly selected: boolean;
  readonly onSelect: (id: string | null) => void;
}

function DefectHighlight({
  defect,
  surface,
  fallbackSurface,
  selected,
  onSelect,
}: DefectHighlightProps) {
  const box = (defect.designBox ?? defect.liveBox) as DashboardBox | undefined;
  if (box === undefined) return null;
  const targetSurface = defect.designBox !== undefined ? surface : fallbackSurface;
  const style = boxToPercentStyle(box, targetSurface);

  return (
    <button
      type="button"
      className={`defect-highlight defect-highlight--${defect.severity}${selected ? ' defect-highlight--selected' : ''}`}
      style={style}
      title={defect.message}
      aria-label={`${defect.severity} ${defect.type}: ${defect.message}`}
      aria-pressed={selected}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(selected ? null : defect.id);
      }}
    />
  );
}

interface SelectedDefectFocusProps {
  readonly defect: DashboardDefect;
  readonly designSurface: { width: number; height: number };
  readonly liveSurface: { width: number; height: number };
  readonly onSelect: (id: string | null) => void;
}

/**
 * Spotlights the active defect: primary box with a dimming halo, plus a dashed
 * companion when both design and live boxes exist (position/color drift).
 */
function SelectedDefectFocus({
  defect,
  designSurface,
  liveSurface,
  onSelect,
}: SelectedDefectFocusProps) {
  const primaryIsDesign = defect.designBox !== undefined;
  const primaryBox = (defect.designBox ?? defect.liveBox) as DashboardBox | undefined;
  if (primaryBox === undefined) return null;

  const primarySurface = primaryIsDesign ? designSurface : liveSurface;
  const companionBox =
    primaryIsDesign && defect.liveBox !== undefined
      ? defect.liveBox
      : !primaryIsDesign && defect.designBox !== undefined
        ? defect.designBox
        : undefined;
  const companionSurface = primaryIsDesign ? liveSurface : designSurface;
  const primaryLabel = primaryIsDesign ? 'Design' : 'Live';
  const companionLabel = primaryIsDesign ? 'Live' : 'Design';

  return (
    <>
      {companionBox !== undefined ? (
        <div
          className="defect-highlight defect-highlight--companion"
          style={boxToPercentStyle(companionBox, companionSurface)}
          aria-hidden="true"
        >
          <span className="defect-highlight__badge">{companionLabel}</span>
        </div>
      ) : null}
      <button
        type="button"
        className={`defect-highlight defect-highlight--${defect.severity} defect-highlight--selected`}
        style={boxToPercentStyle(primaryBox, primarySurface)}
        title={defect.message}
        aria-label={`${defect.severity} ${defect.type}: ${defect.message}`}
        aria-pressed={true}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(null);
        }}
      >
        <span className="defect-highlight__badge">{primaryLabel}</span>
      </button>
      <span className="sr-only">
        Highlighting {defect.type} defect on the {primaryIsDesign ? 'design' : 'live'} surface.
      </span>
    </>
  );
}
