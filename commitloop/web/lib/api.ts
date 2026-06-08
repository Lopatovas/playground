const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
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
  currentStep: string;
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

export type Assignment = {
  stage: { slug: string; title: string; goal: string };
  step: "lesson" | "sandbox" | "project";
  stepLabel: string;
  summary: string;
  checklist: { id: string; label: string; done: boolean }[];
  allChecklistDone: boolean;
  nextHint: string;
  content: { lesson: string; sandbox: string; project: string };
  track: {
    slug: string;
    title: string;
    available: boolean;
    status: "complete" | "current" | "locked";
  }[];
};

export const api = {
  me: () => apiRequest<User>("/me"),
  logout: () =>
    apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  setRepo: (owner: string, name: string) =>
    apiRequest<{ repo: { owner: string; name: string } }>("/repo", {
      method: "POST",
      body: JSON.stringify({ owner, name }),
    }),
  streak: () =>
    apiRequest<{
      configured: boolean;
      repo?: { owner: string; name: string };
      stats: StreakStats | null;
    }>("/streak"),
  assignment: () => apiRequest<Assignment>("/assignment/current"),
  setStep: (step: "lesson" | "sandbox" | "project") =>
    apiRequest<Assignment>("/assignment/step", {
      method: "POST",
      body: JSON.stringify({ step }),
    }),
  toggleChecklist: (itemId: string, done: boolean) =>
    apiRequest<Assignment>("/assignment/checklist", {
      method: "POST",
      body: JSON.stringify({ itemId, done }),
    }),
  advanceStage: () =>
    apiRequest<Assignment>("/assignment/advance", { method: "POST" }),
  trackStages: () =>
    apiRequest<{
      trackId: string;
      stages: Assignment["track"];
    }>("/tracks/track-1/stages"),
  githubLoginUrl: () => `${API_URL}/auth/github`,
};
