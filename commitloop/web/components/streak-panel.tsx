import type { StreakStats } from "@/lib/api";

export function StreakPanel({
  stats,
  repo,
}: {
  stats: StreakStats;
  repo?: { owner: string; name: string };
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card">
      <div className="label">Commitment</div>
      <div className="stat-grid" style={{ marginTop: "1rem" }}>
        <div className="stat">
          <div className="stat-key">Today</div>
          <div
            className={`stat-val ${stats.activeToday ? "ok" : stats.missedToday ? "miss" : ""}`}
          >
            {stats.activeToday ? "✓" : stats.missedToday ? "—" : "·"}
          </div>
        </div>
        <div className="stat">
          <div className="stat-key">Streak</div>
          <div className="stat-val">{stats.currentStreak}</div>
        </div>
        <div className="stat">
          <div className="stat-key">Longest</div>
          <div className="stat-val">{stats.longestStreak}</div>
        </div>
      </div>
      <div className="heatmap">
        {stats.recentDays.slice(-7).map((day) => (
          <div
            key={day.date}
            className={`heat ${day.count > 0 ? "on" : ""} ${day.date === today ? "today" : ""}`}
            title={`${day.date}: ${day.count}`}
          />
        ))}
      </div>
      {repo ? (
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem" }}>
          <a
            href={`https://github.com/${repo.owner}/${repo.name}`}
            target="_blank"
            rel="noreferrer"
          >
            {repo.owner}/{repo.name} →
          </a>
        </p>
      ) : null}
    </div>
  );
}
