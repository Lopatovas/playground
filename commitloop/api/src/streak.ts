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

type GitHubCommit = {
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

function utcYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
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
  const yesterday = utcYesterday();

  const activeToday = byDay.has(today);
  const missedToday = !activeToday && sortedDays.length > 0;

  let longestStreak = 0;
  let run = 0;
  let prev: string | null = null;

  for (const day of sortedDays) {
    if (!prev) {
      run = 1;
    } else {
      const prevDate = new Date(`${prev}T00:00:00Z`);
      const currDate = new Date(`${day}T00:00:00Z`);
      const diff = (currDate.getTime() - prevDate.getTime()) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, run);
    prev = day;
  }

  let currentStreak = 0;
  if (sortedDays.length > 0) {
    const lastDay = sortedDays[sortedDays.length - 1]!;
    if (lastDay === today || lastDay === yesterday) {
      currentStreak = 1;
      for (let i = sortedDays.length - 2; i >= 0; i--) {
        const a = new Date(`${sortedDays[i + 1]}T00:00:00Z`);
        const b = new Date(`${sortedDays[i]}T00:00:00Z`);
        if ((a.getTime() - b.getTime()) / 86400000 === 1) {
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

export async function fetchRepoCommits(
  token: string,
  owner: string,
  repo: string,
  sinceDays = 90,
): Promise<GitHubCommit[]> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - sinceDays);

  const url = new URL(
    `https://api.github.com/repos/${owner}/${repo}/commits`,
  );
  url.searchParams.set("since", since.toISOString());
  url.searchParams.set("per_page", "100");

  const commits: GitHubCommit[] = [];
  let page = 1;

  while (page <= 5) {
    url.searchParams.set("page", String(page));
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`GitHub API ${res.status}: ${body}`);
    }

    const batch = (await res.json()) as GitHubCommit[];
    if (batch.length === 0) break;
    commits.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return commits;
}
