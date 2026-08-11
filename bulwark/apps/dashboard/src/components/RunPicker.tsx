import { useCallback, useEffect, useState } from 'react';

export interface RunListItem {
  readonly id: string;
  readonly status: string;
  readonly reportUrl: string;
  readonly label?: string;
  readonly configName?: string;
  readonly detector?: string;
  readonly generatedAt?: string;
  readonly target?: { readonly url: string };
  readonly summary?: {
    readonly passed: boolean;
    readonly totalDefects: number;
    readonly matchedElementCount: number;
    readonly designElementCount: number;
    readonly matchRate: number;
  };
  readonly durationMs?: number;
}

export interface RunPickerProps {
  readonly selectedReportUrl: string;
  readonly onSelect: (reportUrl: string) => void;
}

export function RunPicker({ selectedReportUrl, onSelect }: RunPickerProps) {
  const [runs, setRuns] = useState<readonly RunListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/runs', { signal });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = (await response.json()) as { runs?: RunListItem[] };
      setRuns(payload.runs ?? []);
    } catch (loadError) {
      if (signal?.aborted) return;
      setError(loadError instanceof Error ? loadError.message : 'Could not load runs');
      setRuns([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  return (
    <aside className="run-picker" aria-label="Saved runs">
      <header className="run-picker__header">
        <h2>Runs</h2>
        <button type="button" className="run-picker__refresh" onClick={() => void refresh()}>
          Refresh
        </button>
      </header>

      {loading ? <p className="run-picker__empty">Loading runs…</p> : null}
      {error !== null ? <p className="run-picker__empty">Could not list runs ({error}).</p> : null}
      {!loading && error === null && runs.length === 0 ? (
        <p className="run-picker__empty">No runs yet. POST /api/runs to create one.</p>
      ) : null}

      <ul className="run-picker__items">
        {runs.map((run) => {
          const selected =
            selectedReportUrl === run.reportUrl ||
            selectedReportUrl.endsWith(`/runs/${encodeURIComponent(run.id)}/report`);
          const title = run.label ?? run.configName ?? run.id;
          const match =
            run.summary === undefined
              ? null
              : `${run.summary.matchedElementCount}/${run.summary.designElementCount}`;
          return (
            <li key={run.id}>
              <button
                type="button"
                className={`run-item${selected ? ' run-item--selected' : ''}${run.summary?.passed === false ? ' run-item--fail' : ''}${run.summary?.passed === true ? ' run-item--pass' : ''}`}
                aria-pressed={selected}
                onClick={() => onSelect(run.reportUrl)}
              >
                <span className="run-item__title">{title}</span>
                <span className="run-item__meta">
                  {run.target !== undefined ? (
                    <span className="run-item__target">{pathnameOf(run.target.url)}</span>
                  ) : null}
                  {run.detector !== undefined ? <span>{run.detector}</span> : null}
                  {match !== null ? <span>{match} matched</span> : null}
                  {run.summary !== undefined ? (
                    <span>
                      {run.summary.totalDefects} defect
                      {run.summary.totalDefects === 1 ? '' : 's'}
                    </span>
                  ) : null}
                </span>
                <span className="run-item__id" title={run.id}>
                  {run.id}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}
