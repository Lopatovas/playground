import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, StreakResponse, User } from "../api";

export default function Dashboard() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [streak, setStreak] = useState<StreakResponse | null>(null);
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .me()
      .then((u) => {
        setUser(u);
        if (u?.repo) {
          setRepoOwner(u.repo.owner);
          setRepoName(u.repo.name);
        }
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;
    api
      .streak()
      .then(setStreak)
      .catch((e) => setError(e.message));
  }, [user, repoOwner, repoName]);

  async function handleRepo(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.setRepo(repoOwner, repoName);
      const u = await api.me();
      setUser(u);
      const s = await api.streak();
      setStreak(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save repo");
    } finally {
      setSaving(false);
    }
  }

  if (user === undefined) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: "4rem 0" }}>
        <h1>Sign in to continue</h1>
        <p style={{ color: "var(--muted)" }}>
          Connect GitHub to track your daily commits.
        </p>
        <a className="btn btn-primary" href={api.githubLoginUrl()}>
          Connect GitHub
        </a>
      </div>
    );
  }

  const stats = streak?.stats;

  return (
    <div className="container" style={{ padding: "2rem 0 4rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              width={40}
              height={40}
              style={{ borderRadius: "50%" }}
            />
          ) : null}
          <div>
            <strong>@{user.username}</strong>
            <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {user.trackId} · {user.currentStage}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link className="btn btn-ghost" to="/curriculum">
            Curriculum
          </Link>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => api.logout().then(() => setUser(null))}
          >
            Log out
          </button>
        </div>
      </header>

      {!streak?.configured ? (
        <div className="card" style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginTop: 0 }}>Connect your project repo</h2>
          <p style={{ color: "var(--muted)" }}>
            Paste the GitHub repo you're building on CommitLoop. We'll track
            commits and streaks.
          </p>
          <form onSubmit={handleRepo}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div className="field">
                <label htmlFor="owner">Owner</label>
                <input
                  id="owner"
                  value={repoOwner}
                  onChange={(e) => setRepoOwner(e.target.value)}
                  placeholder="your-username"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="name">Repository</label>
                <input
                  id="name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-app"
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Track this repo"}
            </button>
          </form>
        </div>
      ) : null}

      {error ? (
        <p style={{ color: "var(--red)", marginBottom: "1rem" }}>{error}</p>
      ) : null}

      {stats ? (
        <>
          <div className="stat-grid" style={{ marginBottom: "2rem" }}>
            <div className="stat">
              <div className="stat-label">Today</div>
              <div
                className={`stat-value ${stats.activeToday ? "active" : stats.missedToday ? "missed" : ""}`}
              >
                {stats.activeToday ? "✓" : stats.missedToday ? "—" : "·"}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Current streak</div>
              <div className="stat-value">{stats.currentStreak}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Longest streak</div>
              <div className="stat-value">{stats.longestStreak}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Commits (90d)</div>
              <div className="stat-value">{stats.totalCommits}</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>
              Last 14 days
              {streak?.repo ? (
                <span
                  style={{
                    fontWeight: 400,
                    color: "var(--muted)",
                    fontSize: "0.9rem",
                    marginLeft: "0.5rem",
                  }}
                >
                  {streak.repo.owner}/{streak.repo.name}
                </span>
              ) : null}
            </h3>
            <div className="heatmap">
              {stats.recentDays.map((day) => (
                <div
                  key={day.date}
                  className={`heat-cell ${day.count > 0 ? "has-commits" : ""} ${day.date === new Date().toISOString().slice(0, 10) ? "today" : ""}`}
                  title={`${day.date}: ${day.count} commit(s)`}
                />
              ))}
            </div>
            {stats.recentDays.length === 0 ? (
              <p style={{ color: "var(--muted)" }}>No commits yet. Ship something.</p>
            ) : null}
          </div>
        </>
      ) : streak?.configured ? (
        <p>Loading streak data…</p>
      ) : null}
    </div>
  );
}
