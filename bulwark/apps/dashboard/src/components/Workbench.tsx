import { useMemo, useReducer, useState } from 'react';
import type { DashboardReport } from '../lib/report-schema.js';
import { DEFAULT_OVERLAY_STATE, overlayReducer } from '../lib/overlay-state.js';
import { OverlayControls } from './OverlayControls.js';
import { OverlayCanvas } from './OverlayCanvas.js';
import { DefectList } from './DefectList.js';

export interface WorkbenchProps {
  readonly report: DashboardReport;
  readonly artifactsBase: string;
}

export function Workbench({ report, artifactsBase }: WorkbenchProps) {
  const [overlay, dispatch] = useReducer(overlayReducer, DEFAULT_OVERLAY_STATE);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);

  const selected = useMemo(
    () => report.defects.find((defect) => defect.id === selectedDefectId) ?? null,
    [report.defects, selectedDefectId],
  );

  const selectDefect = (id: string | null) => {
    setSelectedDefectId(id);
    if (id !== null && !overlay.showHighlights) {
      dispatch({ type: 'toggle-highlights' });
    }
  };

  return (
    <div className="workbench">
      <header className="workbench__header">
        <div className="workbench__brand">
          <p className="workbench__mark">Bulwark</p>
          <h1 className="workbench__title">Visual QA workbench</h1>
        </div>
        <div className="workbench__meta">
          <StatusPill passed={report.summary.passed} />
          <span className="workbench__run" title={report.runId}>
            {report.runId}
          </span>
          <a
            className="workbench__target"
            href={report.target.url}
            target="_blank"
            rel="noreferrer"
          >
            {report.target.url}
          </a>
          <span className="workbench__counts">
            {report.summary.matchedElementCount}/{report.summary.designElementCount} matched ·{' '}
            {report.summary.totalDefects} defect{report.summary.totalDefects === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      <OverlayControls state={overlay} dispatch={dispatch} />

      <div className="workbench__body">
        <OverlayCanvas
          report={report}
          artifactsBase={artifactsBase}
          overlay={overlay}
          selectedDefectId={selectedDefectId}
          onCurtainChange={(position) => dispatch({ type: 'set-curtain', position })}
          onSelectDefect={selectDefect}
        />
        <DefectList
          defects={report.defects}
          selectedId={selectedDefectId}
          onSelect={selectDefect}
        />
      </div>

      {selected !== null ? (
        <footer className="workbench__detail" aria-live="polite">
          <strong>
            {selected.severity} · {selected.type}
          </strong>
          <p>{selected.message}</p>
        </footer>
      ) : null}

      {report.diagnostics.warnings.length > 0 ? (
        <details className="workbench__warnings">
          <summary>
            {report.diagnostics.warnings.length} diagnostic warning
            {report.diagnostics.warnings.length === 1 ? '' : 's'}
          </summary>
          <ul>
            {report.diagnostics.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function StatusPill({ passed }: { readonly passed: boolean }) {
  return (
    <span className={`status-pill status-pill--${passed ? 'pass' : 'fail'}`}>
      {passed ? 'PASS' : 'FAIL'}
    </span>
  );
}
