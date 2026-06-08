import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, CurriculumStage } from "../api";

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hul])/gm, (line) =>
      line.startsWith("<") ? line : `<p>${line}</p>`,
    );
}

export default function Curriculum() {
  const [stages, setStages] = useState<CurriculumStage[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .curriculum("track-1")
      .then((data) => setStages(data.stages))
      .catch((e) => setError(e.message));
  }, []);

  const stage = stages[active];

  return (
    <div className="container" style={{ padding: "2rem 0 4rem" }}>
      <Link to="/" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        ← CommitLoop
      </Link>

      <h1 style={{ marginTop: "1rem" }}>Track 1 — Fundamentals</h1>
      <p style={{ color: "var(--muted)" }}>
        Stage 0–1 available now. More stages ship as we build.
      </p>

      {error ? <p style={{ color: "var(--red)" }}>{error}</p> : null}

      {stages.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {stages.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                className="btn btn-ghost"
                style={{
                  justifyContent: "flex-start",
                  background: i === active ? "var(--surface-2)" : undefined,
                }}
                onClick={() => setActive(i)}
              >
                {s.title.replace(/^Stage \d+ — /, "")}
              </button>
            ))}
          </nav>

          {stage ? (
            <div
              className="card markdown"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(stage.content) }}
            />
          ) : null}
        </div>
      ) : !error ? (
        <p>Loading curriculum…</p>
      ) : null}
    </div>
  );
}
