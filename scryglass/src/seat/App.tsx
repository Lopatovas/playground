import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChangedNode, FixturePr, ReviewSession } from "../domain/types.ts";
import {
  addComment,
  closeSitting,
  health,
  listPrs,
  openSession,
  publishDrafts,
  readFile,
} from "./api.ts";

function riskClass(risk: string): string {
  return `risk ${risk}`;
}

export function App() {
  const [prs, setPrs] = useState<FixturePr[]>([]);
  const [prId, setPrId] = useState("PR-01");
  const [url, setUrl] = useState("");
  const [bitbucketReady, setBitbucketReady] = useState(false);
  const [session, setSession] = useState<ReviewSession | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [fileText, setFileText] = useState("");
  const [line, setLine] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const node = useMemo(
    () => session?.report.changed.find((item) => item.file === selected) ?? null,
    [session, selected],
  );

  const loadPrs = useCallback(async () => {
    const data = await listPrs();
    setPrs(data.prs);
    const status = await health();
    setBitbucketReady(status.hosts.bitbucket);
  }, []);

  const open = useCallback(async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const data = await openSession(id);
      setSession(data.session);
      const first =
        data.session.report.keyPoints[0] ?? data.session.report.changed[0]?.file ?? null;
      setSelected(first);
      setLine(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void loadPrs();
    void open("PR-01");
  }, [loadPrs, open]);

  useEffect(() => {
    if (!session || !selected) return;
    void readFile(session.id, selected)
      .then((file) => setFileText(file.text))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to read file"),
      );
  }, [session, selected]);

  const onSaveDraft = async () => {
    if (!session) return;
    setBusy(true);
    try {
      const data = await addComment(session.id, {
        body: draft,
        file: selected ?? undefined,
        line: line ?? undefined,
      });
      setSession(data.session);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setBusy(false);
    }
  };

  const onPublish = async () => {
    if (!session) return;
    setBusy(true);
    try {
      setSession((await publishDrafts(session.id)).session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  };

  const onCloseSitting = async () => {
    if (!session) return;
    setSession((await closeSitting(session.id)).session);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">SCRYGLASS</div>
        <select
          aria-label="Sample PR"
          value={prId}
          onChange={(event) => {
            setPrId(event.target.value);
            void open(event.target.value);
          }}
        >
          {prs.map((pr) => (
            <option key={pr.id} value={pr.id}>
              {pr.id} — {pr.title}
            </option>
          ))}
        </select>
        <form
          className="open-url"
          onSubmit={(event) => {
            event.preventDefault();
            if (url.trim()) void open(url.trim());
          }}
        >
          <input
            aria-label="Bitbucket PR URL"
            placeholder="https://bitbucket.org/.../pull-requests/12"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <button type="submit" disabled={busy || !url.trim()}>
            Open
          </button>
        </form>
        <div className="identity">
          <h1>{session?.title ?? "Opening…"}</h1>
          <p>
            {session
              ? `${session.host} · ${session.base.slice(0, 8)} → ${session.head.slice(0, 8)}`
              : "opening"}
            {" · "}
            {bitbucketReady
              ? "Bitbucket ready"
              : "fixtures only — set BITBUCKET_TOKEN to open a real PR"}
            {" · Jev unused"}
          </p>
        </div>
        {session ? (
          <span className={riskClass(session.report.risk)}>{session.report.risk}</span>
        ) : null}
        <div className="header-meta">
          <span>{session?.comments.length ?? 0} drafts</span>
          <button
            type="button"
            onClick={() => void onPublish()}
            disabled={!session?.comments.length || busy}
          >
            Publish to PR
          </button>
          <button type="button" onClick={() => void onCloseSitting()} disabled={!session}>
            End sitting
          </button>
        </div>
      </header>
      <main className="seat">
        <section className="pane" aria-label="Change map">
          <h2>Change map</h2>
          <p className="guard">Signals, not a verdict. Rank is flags, not LOC.</p>
          {session?.report.changed.map((item) => (
            <MapRow
              key={item.file}
              node={item}
              selected={item.file === selected}
              onSelect={() => {
                setSelected(item.file);
                setLine(null);
              }}
            />
          ))}
        </section>
        <section className="pane" aria-label="Center stage">
          <h2>Feature / diff</h2>
          {error ? <p className="error">{error}</p> : null}
          {session ? <p>{session.what}</p> : <p className="empty">Open a session.</p>}
          {selected ? (
            <>
              <p className="guard">
                Head snapshot · click a line to anchor a draft
                {line ? ` · line ${line}` : ""}
              </p>
              <div className="file" role="table" aria-label={selected}>
                {fileText.split("\n").map((source, index) => {
                  const n = index + 1;
                  return (
                    <div
                      key={n}
                      className={`file-line${line === n ? " active" : ""}`}
                      onClick={() => setLine(n)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") setLine(n);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="ln">{n}</span>
                      <pre>{source || " "}</pre>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="empty">Select a node.</p>
          )}
        </section>
        <section className="pane" aria-label="Context">
          <h2>Context</h2>
          {node ? <Context node={node} /> : <p className="empty">No selection.</p>}
          {session?.lastSittingAt ? (
            <p className="guard">Last sitting {session.lastSittingAt}.</p>
          ) : (
            <p className="guard">First sitting on this PR.</p>
          )}
          {session?.htmlUrl ? (
            <p className="guard">
              <a href={session.htmlUrl} target="_blank" rel="noreferrer">
                Open on Bitbucket
              </a>
            </p>
          ) : null}
          <div className="compose">
            <textarea
              aria-label="Draft comment"
              placeholder={
                line && selected ? `Draft on ${selected}:${line}` : "General draft on the PR"
              }
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="compose-actions">
              <button
                type="button"
                className="primary"
                disabled={!draft.trim() || busy}
                onClick={() => void onSaveDraft()}
              >
                Save draft
              </button>
            </div>
          </div>
          {session?.comments.map((comment) => (
            <article key={comment.id} className="comment">
              <strong>draft</strong>{" "}
              {comment.anchor.kind === "inline"
                ? `${comment.anchor.file}:${comment.anchor.line}`
                : "general"}
              <div>{comment.body}</div>
            </article>
          ))}
          {session?.published.map((comment) => (
            <article key={comment.id} className="comment">
              <strong>on PR</strong> {comment.hostCommentId}
              <div>{comment.body}</div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function MapRow({
  node,
  selected,
  onSelect,
}: {
  node: ChangedNode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className={`node${selected ? " selected" : ""}`} onClick={onSelect}>
      <span className={riskClass(node.risk)}>{node.risk}</span> {node.file.split("/").pop()}
      <small>
        {node.layer} · {node.flags.map((flag) => flag.id).join(" · ") || "no flags"}
      </small>
    </button>
  );
}

function Context({ node }: { node: ChangedNode }) {
  return (
    <div>
      <p>
        <strong>{node.file}</strong>
      </p>
      <p className="guard">{node.layerWhy}</p>
      <div className="flags">
        {node.flags.map((item) => (
          <span key={item.id} className={`chip ${item.severity}`} title={item.why.join(" · ")}>
            {item.severity}:{item.id}
          </span>
        ))}
      </div>
      <p>consumers {node.consumerCount}</p>
      <p>routes {node.routes.join(", ") || "—"}</p>
      <p>pages {node.pages.map((file) => file.split("/").pop()).join(", ") || "—"}</p>
      <p>tests {node.tests.map((file) => file.split("/").pop()).join(", ") || "—"}</p>
      <p>lines {node.lineCount} (fact, unused for risk)</p>
    </div>
  );
}
