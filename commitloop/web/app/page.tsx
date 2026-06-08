import Link from "next/link";
import { api } from "@/lib/api";

export default function LandingPage() {
  return (
    <>
      <header className="container" style={{ padding: "1.25rem 0" }}>
        <Link href="/" className="logo">
          CommitLoop
        </Link>
      </header>

      <main className="container" style={{ padding: "2.5rem 0 4rem" }}>
        <p className="label">Accountability-first apprenticeship</p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            lineHeight: 1.15,
            maxWidth: "14ch",
            margin: "0.75rem 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Build one real app. Show up every day.
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: "48ch", fontSize: "1.1rem" }}>
          One evolving project. Daily commits. GitHub is the record — not watch
          time.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <a className="btn btn-primary" href={api.githubLoginUrl()}>
            Connect GitHub
          </a>
          <Link className="btn btn-ghost" href="/curriculum">
            View curriculum
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginTop: "3rem",
          }}
        >
          <div className="card">
            <h3 style={{ marginTop: 0 }}>The loop</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Lesson → Sandbox → Project. Every concept lands in your codebase.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>One project</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              No resets. Refactors and migrations count as progress.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>GitHub truth</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Streaks and activity come from real commits on your repo.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
