import { useReport } from './hooks/use-report.js';
import { Workbench } from './components/Workbench.js';

export function App() {
  const state = useReport();

  if (state.status === 'loading') {
    return (
      <main className="boot-state">
        <p className="workbench__mark">Bulwark</p>
        <p>Loading report…</p>
      </main>
    );
  }

  if (state.status === 'error') {
    return (
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
          Serve a run directory with <code>bulwark serve --run &lt;dir&gt;</code>, or open this page
          with <code>?report=/artifacts/report.json</code>.
        </p>
      </main>
    );
  }

  return <Workbench report={state.report} artifactsBase={state.artifactsBase} />;
}
