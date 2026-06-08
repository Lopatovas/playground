import { api } from "../api";

const WAITLIST_URL = import.meta.env.VITE_WAITLIST_URL as string | undefined;

export default function Landing() {
  return (
    <div>
      <header className="container" style={{ padding: "1.5rem 0" }}>
        <strong style={{ fontFamily: "var(--mono)", letterSpacing: "-0.02em" }}>
          CommitLoop
        </strong>
      </header>

      <main className="container" style={{ padding: "3rem 0 5rem" }}>
        <p
          style={{
            color: "var(--green)",
            fontFamily: "var(--mono)",
            fontSize: "0.9rem",
            marginBottom: "1rem",
          }}
        >
          accountability-first apprenticeship
        </p>

        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            lineHeight: 1.1,
            maxWidth: "16ch",
            margin: "0 0 1.25rem",
            letterSpacing: "-0.03em",
          }}
        >
          Stop collecting certificates. Start shipping code.
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "var(--muted)",
            maxWidth: "52ch",
            marginBottom: "2rem",
          }}
        >
          One evolving project. Daily commits. Real mentors. GitHub is the
          source of truth — not watch time.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a className="btn btn-primary" href={api.githubLoginUrl()}>
            Connect GitHub →
          </a>
          <a className="btn btn-ghost" href="/curriculum">
            View curriculum
          </a>
        </div>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1rem",
            marginTop: "4rem",
          }}
        >
          <div className="card">
            <h3 style={{ marginTop: 0 }}>The CommitLoop</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Lesson → Sandbox → Project. Every concept lands in your codebase,
              not a throwaway exercise.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>One project. No resets.</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Build one app that grows for months. Refactors count. Restarts
              don't.
            </p>
          </div>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>One commit per day</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Minimum bar, maximum habit. Features, fixes, tests, docs — all
              count.
            </p>
          </div>
        </section>

        <section className="card" style={{ marginTop: "2rem" }}>
          <h2 style={{ marginTop: 0 }}>Tracks</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 0.5rem" }}>Track 1 — Fundamentals</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Full-stack breadth. DB, API, UI, deploy, test. For people who
                don't know their direction yet.
              </p>
            </div>
            <div>
              <h3 style={{ margin: "0 0 0.5rem" }}>Track 2 — Frontend & React</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                HTML → React → React Native on the same product. Frontend only —
                backend is your choice.
              </p>
            </div>
          </div>
        </section>

        {WAITLIST_URL ? (
          <section style={{ marginTop: "3rem", textAlign: "center" }}>
            <h2>Join the waitlist</h2>
            <p style={{ color: "var(--muted)" }}>
              Founding cohort opening soon.
            </p>
            <a className="btn btn-primary" href={WAITLIST_URL}>
              Get notified
            </a>
          </section>
        ) : null}
      </main>

      <footer
        className="container"
        style={{
          padding: "2rem 0",
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          fontSize: "0.85rem",
        }}
      >
        One loop. One project. Every day.
      </footer>
    </div>
  );
}
