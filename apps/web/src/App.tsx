import { useEffect, useMemo, useState } from "react";
import type { ActionItem, ScanFinding, ScanListItem, ScanReport, ScoreBreakdown } from "@ai-readiness/shared";
import { getScan, listScans, uploadScan } from "./api.js";

const audienceOptions = [
  { value: "mixed", label: "Mixed audience" },
  { value: "executive", label: "Executive" },
  { value: "technical", label: "Technical / data engineering" },
  { value: "compliance", label: "Compliance / legal" },
  { value: "ai-implementation", label: "AI implementation team" },
];

export function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [audience, setAudience] = useState("mixed");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanListItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void refreshHistory();
  }, []);

  const criticalCount = useMemo(
    () => report?.findings.filter((finding) => finding.severity === "critical").length ?? 0,
    [report],
  );

  async function refreshHistory() {
    try {
      setScanHistory(await listScans());
    } catch {
      setScanHistory([]);
    }
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Choose a CSV, XLS or XLSX file first.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const nextReport = await uploadScan({
        file: selectedFile,
        datasetName: datasetName || selectedFile.name.replace(/\.[^.]+$/, ""),
        audience,
      });

      setReport(nextReport);
      await refreshHistory();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function loadScan(scanId: string) {
    setError(null);

    try {
      setReport(await getScan(scanId));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load scan.");
    }
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Secure AI data readiness</p>
          <h1>AI Data Readiness Scanner</h1>
          <p className="hero-copy">
            Upload CSV or Excel data, get deterministic quality and privacy findings, and generate a layered AI readiness
            report for business, technical and compliance stakeholders.
          </p>
        </div>
        <div className="hero-card">
          <strong>Default privacy model</strong>
          <span>Raw rows are analyzed deterministically by the API. The LLM adapter only receives aggregate findings.</span>
        </div>
      </section>

      <section className="grid two-column">
        <form className="panel upload-panel" onSubmit={handleUpload}>
          <div className="section-heading">
            <p className="eyebrow">Baseline or monthly scan</p>
            <h2>Upload dataset</h2>
          </div>

          <label>
            Dataset name
            <input
              value={datasetName}
              onChange={(event) => setDatasetName(event.target.value)}
              placeholder="e.g. player_transactions_june"
            />
          </label>

          <label>
            Report audience
            <select value={audience} onChange={(event) => setAudience(event.target.value)}>
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="file-drop">
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            />
            <span>{selectedFile ? selectedFile.name : "Choose CSV/XLSX file"}</span>
          </label>

          {error && <p className="error">{error}</p>}

          <button disabled={isUploading}>{isUploading ? "Scanning..." : "Run readiness scan"}</button>
        </form>

        <aside className="panel">
          <div className="section-heading">
            <p className="eyebrow">Recent scans</p>
            <h2>History</h2>
          </div>
          {scanHistory.length === 0 ? (
            <p className="muted">No scans yet. Upload a dataset to create the first baseline.</p>
          ) : (
            <div className="history-list">
              {scanHistory.map((scan) => (
                <button key={scan.id} type="button" onClick={() => void loadScan(scan.id)}>
                  <span>{scan.datasetName}</span>
                  <strong>{scan.overallScore ?? "-"} / 100</strong>
                  <small>{new Date(scan.createdAt).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}
        </aside>
      </section>

      {report ? (
        <ReportView report={report} criticalCount={criticalCount} />
      ) : (
        <section className="empty-state">
          <h2>No report loaded</h2>
          <p>Run a scan to view the executive summary, score breakdown, action plan and traceable findings.</p>
        </section>
      )}
    </main>
  );
}

function ReportView({ report, criticalCount }: { report: ScanReport; criticalCount: number }) {
  return (
    <section className="report">
      <div className="score-hero panel">
        <div>
          <p className="eyebrow">Executive layer</p>
          <h2>{report.datasetName}</h2>
          <p>{report.summary.businessImpact}</p>
        </div>
        <ScoreCircle score={report.overallScore} label="Overall readiness" />
      </div>

      <div className="grid three-column">
        <MetricCard label="Tables" value={report.profiles.length} />
        <MetricCard label="Findings" value={report.findings.length} />
        <MetricCard label="Critical findings" value={criticalCount} />
      </div>

      {report.comparison && (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Recurring monitoring</p>
            <h2>Compared with previous scan</h2>
          </div>
          <div className="comparison-row">
            <strong>{formatDelta(report.comparison.scoreDelta)} overall points</strong>
            {report.comparison.categoryDeltas.map((delta) => (
              <span key={delta.category}>
                {delta.label}: {formatDelta(delta.delta)}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Score layer</p>
          <h2>Sub-score breakdown</h2>
        </div>
        <div className="score-grid">
          {report.scoreBreakdown.map((score) => (
            <ScoreBar key={score.category} score={score} />
          ))}
        </div>
      </section>

      <section className="grid two-column">
        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Action layer</p>
            <h2>Prioritized action plan</h2>
          </div>
          <ActionList items={report.actionPlan} />
        </div>

        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Risk layer</p>
            <h2>Top risks</h2>
          </div>
          <ul className="risk-list">
            {report.summary.topRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Technical traceability</p>
          <h2>Findings</h2>
        </div>
        <FindingsTable findings={report.findings} />
      </section>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Data profile</p>
          <h2>Tables and columns</h2>
        </div>
        <div className="table-profile-grid">
          {report.profiles.map((profile) => (
            <article key={profile.name} className="profile-card">
              <h3>{profile.name}</h3>
              <p>
                {profile.rowCount} rows, {profile.columnCount} columns, {profile.duplicateRowsPercent}% duplicate rows
              </p>
              <div className="column-chips">
                {profile.columns.slice(0, 20).map((column) => (
                  <span key={column.name} title={`${column.inferredType}, ${column.missingPercent}% missing`}>
                    {column.name}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  return (
    <div className={`score-circle ${scoreClass(score)}`}>
      <strong>{score}</strong>
      <span>/100</span>
      <small>{label}</small>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScoreBar({ score }: { score: ScoreBreakdown }) {
  return (
    <article className="score-bar">
      <div>
        <strong>{score.label}</strong>
        <span>{score.score}/100</span>
      </div>
      <div className="bar">
        <span className={scoreClass(score.score)} style={{ width: `${score.score}%` }} />
      </div>
      <p>{score.rationale}</p>
    </article>
  );
}

function ActionList({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return <p className="muted">No action items were generated for this scan.</p>;
  }

  return (
    <div className="action-list">
      {items.map((item) => (
        <article key={`${item.priority}-${item.title}`}>
          <strong>{item.priority}</strong>
          <div>
            <h3>{item.title}</h3>
            <p>{item.whyItMatters}</p>
            <small>
              Fix: {item.recommendedFix} Expected impact: +{item.expectedScoreImpact}
            </small>
          </div>
        </article>
      ))}
    </div>
  );
}

function FindingsTable({ findings }: { findings: ScanFinding[] }) {
  if (findings.length === 0) {
    return <p className="muted">No findings detected.</p>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Category</th>
            <th>Issue</th>
            <th>Location</th>
            <th>Evidence</th>
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((finding) => (
            <tr key={finding.id}>
              <td>
                <span className={`badge ${finding.severity}`}>{finding.severity}</span>
              </td>
              <td>{finding.category.replaceAll("_", " ")}</td>
              <td>{finding.title}</td>
              <td>{[finding.tableName, finding.columnName].filter(Boolean).join(".")}</td>
              <td>{finding.evidence}</td>
              <td>-{finding.scoreImpact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function scoreClass(score: number): string {
  if (score >= 80) return "good";
  if (score >= 60) return "warning";
  return "bad";
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}
