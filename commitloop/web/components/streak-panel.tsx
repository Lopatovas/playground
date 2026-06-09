import type { StreakStats } from "@/lib/api";

const HEATMAP_DAYS = 7;

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function lastCalendarDaysUTC(days: number): string[] {
  const result: string[] = [];
  const now = new Date();

  for (let offset = days - 1; offset >= 0; offset--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - offset);
    result.push(d.toISOString().slice(0, 10));
  }

  return result;
}

function formatHeatTooltip(date: string, count: number): string {
  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  if (count === 0) return `${label}: no commits`;
  return `${label}: ${count} commit${count === 1 ? "" : "s"}`;
}

export function isWeekendUTC(date: string): boolean {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

export function buildHeatmapDays(
  recentDays: StreakStats["recentDays"],
  days = HEATMAP_DAYS,
) {
  const counts = new Map(recentDays.map((day) => [day.date, day.count]));

  return lastCalendarDaysUTC(days).map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));
}

export function heatmapCellClass(day: {
  date: string;
  count: number;
}): string {
  const classes = ["heat"];
  if (day.count > 0) {
    classes.push("on");
  } else if (!isWeekendUTC(day.date)) {
    classes.push("miss");
  }
  if (day.date === utcToday()) {
    classes.push("today");
  }
  return classes.join(" ");
}

export function StreakPanel({
  stats,
  repo,
}: {
  stats: StreakStats;
  repo?: { owner: string; name: string };
}) {
  const heatmapDays = buildHeatmapDays(stats.recentDays);

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
      <div className="heatmap" role="img" aria-label="Last 7 days of commits">
        {heatmapDays.map((day) => (
          <div
            key={day.date}
            className={heatmapCellClass(day)}
            data-tooltip={formatHeatTooltip(day.date, day.count)}
            aria-label={formatHeatTooltip(day.date, day.count)}
            tabIndex={0}
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
