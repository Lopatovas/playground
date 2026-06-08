const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type User = {
  id: string;
  username: string;
  avatarUrl: string | null;
  repo: { owner: string; name: string } | null;
  trackId: string;
  currentStage: string;
};

export type StreakStats = {
  activeToday: boolean;
  missedToday: boolean;
  currentStreak: number;
  longestStreak: number;
  totalCommits: number;
  lastActivityDate: string | null;
  recentDays: { date: string; count: number; messages: string[] }[];
};

export type StreakResponse = {
  configured: boolean;
  repo?: { owner: string; name: string };
  stats: StreakStats | null;
};

export type CurriculumStage = {
  slug: string;
  title: string;
  content: string;
};

export const api = {
  me: () => request<User | null>("/me").catch(() => null),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  setRepo: (owner: string, name: string) =>
    request<{ repo: { owner: string; name: string } }>("/repo", {
      method: "POST",
      body: JSON.stringify({ owner, name }),
    }),
  streak: () => request<StreakResponse>("/streak"),
  curriculum: (trackId: string) =>
    request<{ trackId: string; stages: CurriculumStage[] }>(
      `/curriculum/${trackId}`,
    ),
  githubLoginUrl: () => `${API_URL}/auth/github`,
};
