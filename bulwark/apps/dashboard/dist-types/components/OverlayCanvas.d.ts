import type { DashboardReport } from '../lib/report-schema.js';
import type { OverlayState } from '../lib/overlay-state.js';
export interface OverlayCanvasProps {
  readonly report: DashboardReport;
  readonly artifactsBase: string;
  readonly overlay: OverlayState;
  readonly selectedDefectId: string | null;
  readonly onCurtainChange: (position: number) => void;
  readonly onSelectDefect: (id: string | null) => void;
}
export declare function OverlayCanvas({
  report,
  artifactsBase,
  overlay,
  selectedDefectId,
  onCurtainChange,
  onSelectDefect,
}: OverlayCanvasProps): import('react').JSX.Element;
//# sourceMappingURL=OverlayCanvas.d.ts.map
