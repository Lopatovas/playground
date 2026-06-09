export type CommitDay = {
  date: string;
  count: number;
  messages: string[];
};

export type StreakStats = {
  activeToday: boolean;
  missedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCommits: number;
  lastActivityDate: string | null;
  recentDays: CommitDay[];
};

export type GitHubCommit = {
  sha?: string;
  commit: {
    author: { date: string };
    message: string;
  };
};

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function isWeekendUTC(date: string): boolean {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

function addDaysUTC(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetweenUTC(a: string, b: string): number {
  const aDate = new Date(`${a}T00:00:00Z`);
  const bDate = new Date(`${b}T00:00:00Z`);
  return (bDate.getTime() - aDate.getTime()) / 86400000;
}

function gapIsWeekendsOnly(fromDay: string, toDay: string): boolean {
  if (daysBetweenUTC(fromDay, toDay) <= 1) return true;

  let cursor = addDaysUTC(fromDay, 1);
  while (cursor < toDay) {
    if (!isWeekendUTC(cursor)) return false;
    cursor = addDaysUTC(cursor, 1);
  }

  return true;
}

export function streakContinues(earlierDay: string, laterDay: string): boolean {
  const diff = daysBetweenUTC(earlierDay, laterDay);
  if (diff === 1) return true;
  if (diff > 1) return gapIsWeekendsOnly(earlierDay, laterDay);
  return false;
}

function chainStillActive(
  lastCommitDay: string,
  today: string,
  commitDays: Set<string>,
): boolean {
  if (lastCommitDay > today) return false;
  if (lastCommitDay === today) return true;

  let cursor = addDaysUTC(lastCommitDay, 1);
  while (cursor <= today) {
    if (!commitDays.has(cursor) && !isWeekendUTC(cursor)) {
      return false;
    }
    cursor = addDaysUTC(cursor, 1);
  }

  return true;
}

export function computeStreak(commits: GitHubCommit[]): StreakStats {
  const byDay = new Map<string, { count: number; messages: string[] }>();

  for (const c of commits) {
    const key = toDateKey(c.commit.author.date);
    const entry = byDay.get(key) ?? { count: 0, messages: [] };
    entry.count += 1;
    if (entry.messages.length < 5) {
      entry.messages.push(c.commit.message.split("\n")[0] ?? "");
    }
    byDay.set(key, entry);
  }

  const sortedDays = [...byDay.keys()].sort();
  const today = utcToday();
  const commitDays = new Set(sortedDays);

  const activeToday = byDay.has(today);
  const missedToday = !activeToday && sortedDays.length > 0;

  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;

  for (const day of sortedDays) {
    if (!prev) {
      run = 1;
    } else if (streakContinues(prev, day)) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = day;
  }

  let currentStreak = 0;
  if (sortedDays.length > 0) {
    const lastDay = sortedDays[sortedDays.length - 1]!;
    if (chainStillActive(lastDay, today, commitDays)) {
      currentStreak = 1;
      for (let i = sortedDays.length - 2; i >= 0; i--) {
        if (streakContinues(sortedDays[i]!, sortedDays[i + 1]!)) {
          currentStreak += 1;
        } else {
          break;
        }
      }
    }
  }

  const recentDays: CommitDay[] = sortedDays.slice(-14).map((date) => ({
    date,
    count: byDay.get(date)!.count,
    messages: byDay.get(date)!.messages,
  }));

  return {
    activeToday,
    missedToday,
    currentStreak,
    longestStreak,
    totalCommits: commits.length,
    lastActivityDate: sortedDays.at(-1) ?? null,
    recentDays,
  };
}
