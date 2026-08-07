import type { DashboardBox, DashboardDefect, DashboardReport } from '../lib/report-schema.js';
import { curtainClipPath, curtainComplementClipPath } from '../lib/clip-path.js';
import { boxToPercentStyle, overlayFrameSize } from '../lib/geometry.js';
import { defectHighlightBox } from '../lib/defects.js';
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
  const highlight = selected === null ? null : defectHighlightBox(selected);

  return (
    <div
      className={`overlay-canvas${curtain.dragging ? ' overlay-canvas--dragging' : ''}`}
      ref={curtain.ref}
      onPointerDown={overlay.mode === 'curtain' ? curtain.onPointerDown : undefined}
      style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
      role="img"
      aria-label="Design and live overlay"
    >
      <div className="overlay-canvas__frame">
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
          ? report.defects.map((defect) => (
              <DefectHighlight
                key={defect.id}
                defect={defect}
                surface={report.surfaces.design}
                fallbackSurface={report.surfaces.live}
                selected={defect.id === selectedDefectId}
                onSelect={onSelectDefect}
              />
            ))
          : null}

        {highlight !== null && overlay.showHighlights ? (
          <span className="sr-only">
            Highlighting {selected?.type} defect on the {highlight.surface} surface.
          </span>
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
