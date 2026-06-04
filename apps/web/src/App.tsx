import { useEffect, useMemo, useState } from "react";
import type {
  ActionItem,
  ColumnDictionaryEntry,
  RemediationPlaybookItem,
  ReportChatMessage,
  ReportSummary,
  ScanFinding,
  ScanListItem,
  ScanReport,
  ScoreBreakdown,
} from "@ai-readiness/shared";
import { chatAboutReport, getScan, listScans, uploadScan } from "./api.js";

const defaultTenantId = "demo-company";

const audienceOptions = [
  { value: "mixed", label: "Mixed audience" },
  { value: "executive", label: "Executive" },
  { value: "technical", label: "Technical / data engineering" },
  { value: "compliance", label: "Compliance / legal" },
  { value: "ai-implementation", label: "AI implementation team" },
];

const audienceLabelByValue = Object.fromEntries(audienceOptions.map((option) => [option.value, option.label]));

export function App() {
  const [tenantId, setTenantId] = useState(() => localStorage.getItem("tenantId") ?? defaultTenantId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [audience, setAudience] = useState("mixed");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanListItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("tenantId", tenantId);
    setReport(null);
    setActiveScanId(null);
    void refreshHistory(tenantId);
  }, [tenantId]);

  useEffect(() => {
    if (!report || (report.status !== "queued" && report.status !== "processing")) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadScan(report.scanId, false);
      void refreshHistory(tenantId);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [report?.scanId, report?.status, tenantId]);

  const criticalCount = useMemo(
    () => report?.findings.filter((finding) => finding.severity === "critical").length ?? 0,
    [report],
  );

  async function refreshHistory(nextTenantId = tenantId) {
    try {
      setScanHistory(await listScans(nextTenantId));
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
        tenantId,
        file: selectedFile,
        datasetName: datasetName || selectedFile.name.replace(/\.[^.]+$/, ""),
        audience,
      });

      setReport(nextReport);
      setActiveScanId(nextReport.scanId);
      await refreshHistory(tenantId);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function loadScan(scanId: string, clearError = true) {
    if (clearError) setError(null);

    try {
      const nextReport = await getScan(tenantId, scanId);
      setReport(nextReport);
      setActiveScanId(scanId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load scan.");
    }
  }

  return (
    <div className="app-frame">
      <header className="top-bar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>Readiness Scanner</strong>
            <span>Deterministic audit · optional AI narrative</span>
          </div>
        </div>
        <div className="top-bar-meta">
          <span className="top-pill">Tenant</span>
          <code>{tenantId}</code>
        </div>
      </header>

      <main className="app-shell">
      <section className="hero">
        <div className="hero-main">
          <p className="eyebrow">Secure AI data readiness</p>
          <h1>Know if your data is ready for AI</h1>
          <p className="hero-copy">
            Upload CSV or Excel exports, get traceable quality and privacy findings, and share layered reports with
            executive, engineering, and compliance teams.
          </p>
          <div className="hero-stats">
            <div>
              <strong>{scanHistory.length}</strong>
              <span>Scans in history</span>
            </div>
            <div>
              <strong>{scanHistory.filter((scan) => scan.status === "completed").length}</strong>
              <span>Completed reports</span>
            </div>
          </div>
        </div>
        <div className="hero-card panel-accent">
          <p className="eyebrow">Privacy model</p>
          <strong>Rows stay in your stack</strong>
          <span>Deterministic analysis runs on the API. LLM layers only see aggregate findings — never raw cell values.</span>
        </div>
      </section>

      <section className="grid two-column">
        <form className="panel upload-panel" onSubmit={handleUpload}>
          <div className="section-heading">
            <p className="eyebrow">Baseline or monthly scan</p>
            <h2>Upload dataset</h2>
          </div>

          <label>
            Company / tenant ID
            <input
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              placeholder="e.g. company-x"
              pattern="[a-zA-Z0-9._:-]+"
            />
          </label>

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
            <small className="field-hint">AI summary and action-plan wording are tailored to this audience when Mistral is configured.</small>
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
            <p className="tenant-note">Scoped to <strong>{tenantId}</strong></p>
          </div>
          {scanHistory.length === 0 ? (
            <p className="muted">No scans yet. Upload a dataset to create the first baseline.</p>
          ) : (
            <div className="history-list">
              {scanHistory.map((scan) => (
                <button
                  key={scan.id}
                  type="button"
                  className={activeScanId === scan.id ? "history-item active" : "history-item"}
                  onClick={() => void loadScan(scan.id)}
                >
                  <div className="history-item-top">
                    <span>{scan.datasetName}</span>
                    <span className={`status-chip ${scan.status}`}>{scan.status}</span>
                  </div>
                  <strong className={scoreClass(scan.overallScore ?? 0)}>{scan.overallScore ?? "—"}</strong>
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
        <section className="empty-state panel">
          <div className="empty-icon" aria-hidden="true" />
          <h2>No report loaded</h2>
          <p>Upload a dataset or pick a scan from history to view scores, action plan, and traceable findings.</p>
        </section>
      )}
      </main>
    </div>
  );
}

function ReportView({ report, criticalCount }: { report: ScanReport; criticalCount: number }) {
  const [showStandardWording, setShowStandardWording] = useState(false);
  const [showStandardComparison, setShowStandardComparison] = useState(false);
  const hasDeterministicCopy = Boolean(report.llmEnhanced && report.deterministicSummary);
  const summary = pickSummary(report, showStandardWording);
  const actionPlan = pickActionPlan(report, showStandardWording);
  const audienceLabel = audienceLabelByValue[report.reportAudience ?? "mixed"] ?? report.reportAudience ?? "Mixed";

  return (
    <section className="report">
      <div className="score-hero panel">
        <div>
          <p className="eyebrow">Executive layer</p>
          <h2>{report.datasetName}</h2>
          <p className="tenant-note">
            Tenant: <strong>{report.tenantId}</strong> · Status: <strong>{report.status}</strong>
            {report.reportAudience && (
              <>
                {" "}
                · Audience: <strong>{audienceLabel}</strong>
              </>
            )}
          </p>
          {report.llmEnhanced ? (
            <span className="llm-badge">AI-enhanced summary · {report.llmProvider ?? "LLM"}</span>
          ) : (
            <span className="llm-badge muted-badge">Standard deterministic summary</span>
          )}
          {hasDeterministicCopy && (
            <label className="wording-toggle">
              <input
                type="checkbox"
                checked={showStandardWording}
                onChange={(event) => setShowStandardWording(event.target.checked)}
              />
              Show standard (non-AI) wording
            </label>
          )}
          <p className="summary-headline">{summary.headline}</p>
          <p>{summary.businessImpact}</p>
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
            <strong className={deltaClass(report.comparison.scoreDelta)}>
              {formatDelta(report.comparison.scoreDelta)} overall
            </strong>
            {report.comparison.categoryDeltas.map((delta) => (
              <span key={delta.category} className={deltaClass(delta.delta)}>
                {delta.label}: {formatDelta(delta.delta)}
              </span>
            ))}
          </div>
          {(report.comparison.narrative || report.comparison.deterministicNarrative) && (
            <div className="comparison-narrative">
              <p>
                {showStandardComparison
                  ? report.comparison.deterministicNarrative
                  : report.comparison.narrative ?? report.comparison.deterministicNarrative}
              </p>
              {report.comparison.deterministicNarrative &&
                report.comparison.narrative &&
                report.comparison.narrative !== report.comparison.deterministicNarrative && (
                  <label className="wording-toggle">
                    <input
                      type="checkbox"
                      checked={showStandardComparison}
                      onChange={(event) => setShowStandardComparison(event.target.checked)}
                    />
                    Show standard comparison narrative
                  </label>
                )}
            </div>
          )}
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
          <ActionList items={actionPlan} />
        </div>

        <div className="panel">
          <div className="section-heading">
            <p className="eyebrow">Risk layer</p>
            <h2>Top risks</h2>
          </div>
          <ul className="risk-list">
            {summary.topRisks.map((risk) => (
              <li key={risk}>{risk}</li>
            ))}
          </ul>
          {summary.nextSteps.length > 0 && (
            <>
              <h3 className="inline-subheading">Suggested next steps</h3>
              <ul className="risk-list">
                {summary.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {report.remediationPlaybook && report.remediationPlaybook.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">AI remediation playbook</p>
            <h2>Phased fix plan</h2>
          </div>
          <RemediationPlaybookList items={report.remediationPlaybook} />
        </section>
      )}

      {report.columnDictionary && report.columnDictionary.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">AI column dictionary</p>
            <h2>Suggested field meanings</h2>
          </div>
          <ColumnDictionaryTable entries={report.columnDictionary} />
        </section>
      )}

      <ReportChatPanel tenantId={report.tenantId} scanId={report.scanId} />

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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const tier = scoreClass(score);

  return (
    <div className={`score-ring ${tier}`} aria-label={`${label}: ${score} out of 100`}>
      <svg viewBox="0 0 120 120" role="presentation">
        <circle className="score-ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="score-ring-fill"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-ring-value">
        <strong>{score}</strong>
        <span>/100</span>
        <small>{label}</small>
      </div>
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

function deltaClass(delta: number): string {
  if (delta > 0) return "delta-up";
  if (delta < 0) return "delta-down";
  return "delta-flat";
}

function pickSummary(report: ScanReport, showStandardWording: boolean): ReportSummary {
  if (showStandardWording && report.deterministicSummary) {
    return report.deterministicSummary;
  }

  return report.summary;
}

function pickActionPlan(report: ScanReport, showStandardWording: boolean): ActionItem[] {
  if (showStandardWording && report.deterministicActionPlan) {
    return report.deterministicActionPlan;
  }

  return report.actionPlan;
}

function ColumnDictionaryTable({ entries }: { entries: ColumnDictionaryEntry[] }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Table</th>
            <th>Column</th>
            <th>Suggested definition</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={`${entry.tableName}.${entry.columnName}`}>
              <td>{entry.tableName}</td>
              <td>{entry.columnName}</td>
              <td>{entry.suggestedDefinition}</td>
              <td>{entry.dataNotes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RemediationPlaybookList({ items }: { items: RemediationPlaybookItem[] }) {
  return (
    <div className="playbook-list">
      {items.map((item) => (
        <article key={`${item.phase}-${item.owner}`}>
          <h3>
            {item.phase} · <span>{item.owner}</span>
          </h3>
          <ul>
            {item.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function ReportChatPanel({ tenantId, scanId }: { tenantId: string; scanId: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ReportChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setError(null);
    setIsSending(true);
    const nextHistory = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextHistory);
    setInput("");

    try {
      const response = await chatAboutReport({
        tenantId,
        scanId,
        message: trimmed,
        history: messages,
      });
      setMessages([...nextHistory, { role: "assistant", content: response.reply }]);
    } catch (sendError) {
      setMessages(messages);
      setInput(trimmed);
      setError(sendError instanceof Error ? sendError.message : "Could not send message.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="panel report-chat">
      <div className="section-heading">
        <p className="eyebrow">Optional</p>
        <h2>Ask about this report</h2>
        <p className="muted">Grounded Q&amp;A — only topics from this scan (scores, findings, fixes, comparison).</p>
      </div>
      {!open ? (
        <button type="button" className="secondary-button" onClick={() => setOpen(true)}>
          Open report assistant
        </button>
      ) : (
        <>
          <div className="chat-log">
            {messages.length === 0 ? (
              <p className="muted">Example: “What should we fix first?” or “Why did the privacy score change?”</p>
            ) : (
              messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                  <strong>{message.role === "user" ? "You" : "Assistant"}</strong>
                  <p>{message.content}</p>
                </div>
              ))
            )}
          </div>
          {error && <p className="error">{error}</p>}
          <form className="chat-form" onSubmit={handleSend}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a question about this report…"
              maxLength={500}
              disabled={isSending}
            />
            <button type="submit" disabled={isSending}>
              {isSending ? "Sending…" : "Send"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
