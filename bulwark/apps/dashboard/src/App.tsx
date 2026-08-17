import { useCallback, useEffect, useState } from 'react';
import { useReport } from './hooks/use-report.js';
import { Workbench } from './components/Workbench.js';
import { RunPicker } from './components/RunPicker.js';
import { reportUrlFromLocation } from './lib/urls.js';

export function App() {
  const [search, setSearch] = useState(
    typeof window === 'undefined' ? '' : window.location.search,
  );
  const state = useReport(search);
  const selectedReportUrl = reportUrlFromLocation(search);

  useEffect(() => {
    const onPopState = () => setSearch(window.location.search);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const selectReport = useCallback((reportUrl: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('report', reportUrl);
    window.history.pushState({}, '', url);
    setSearch(url.search);
  }, []);

  if (state.status === 'loading') {
    return (
      <div className="app-shell">
        <RunPicker selectedReportUrl={selectedReportUrl} onSelect={selectReport} />
        <main className="boot-state">
          <p className="workbench__mark">Bulwark</p>
          <p>Loading report…</p>
        </main>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="app-shell">
        <RunPicker selectedReportUrl={selectedReportUrl} onSelect={selectReport} />
        <main className="boot-state boot-state--error">
          <p className="workbench__mark">Bulwark</p>
          <h1>Could not open this run</h1>
          <p>{state.message}</p>
          {state.issues !== undefined && state.issues.length > 0 ? (
            <ul>
              {state.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
          <p className="boot-state__hint">
            Pick a run from the list, or open with <code>?report=/api/runs/&lt;id&gt;/report</code>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <RunPicker selectedReportUrl={selectedReportUrl} onSelect={selectReport} />
      <Workbench report={state.report} artifactsBase={state.artifactsBase} />
    </div>
  );
}
