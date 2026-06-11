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
  isMentor: boolean;
};

export type MentorStudent = {
  id: string;
  username: string;
  avatarUrl: string | null;
  trackId: string;
  currentStage: string;
  stageTitle: string;
  currentStep: string;
  quizPassed: boolean;
  repo: { owner: string; name: string } | null;
  repoUrl: string | null;
  streak: {
    configured: boolean;
    activeToday: boolean;
    missedToday: boolean;
    currentStreak: number;
    lastActivityDate: string | null;
  } | null;
  attention: "ok" | "missed_today" | "no_repo" | "inactive";
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

export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: { id: string; text: string }[];
};

export type LessonPage = {
  id: string;
  title: string;
  body: string;
};

export type SandboxCheckpoint =
  | {
      kind: "choice";
      prompt: string;
      choices: { id: string; text: string }[];
    }
  | {
      kind: "text";
      prompt: string;
      placeholder?: string;
    };

export type SandboxStep = {
  id: string;
  title: string;
  body: string;
  checkpoint?: SandboxCheckpoint;
};

export type SandboxCheckResult = {
  correct: boolean;
  explanation: string;
};

export type QuizResult = {
  score: number;
  passed: boolean;
  results: {
    questionId: string;
    correct: boolean;
    explanation: string;
  }[];
};

export type Assignment = {
  stage: { slug: string; title: string; goal: string };
  step: "lesson" | "sandbox" | "quiz" | "project";
  stepLabel: string;
  summary: string;
  checklist: { id: string; label: string; done: boolean }[];
  allChecklistDone: boolean;
  quiz: {
    passScore: number;
    questions: QuizQuestion[];
  };
  quizPassed: boolean;
  canAccessProject: boolean;
  nextHint: string;
  content: {
    lesson: { pages: LessonPage[] };
    sandbox: { intro?: string; steps: SandboxStep[] };
    project: string;
  };
  track: {
    slug: string;
    title: string;
    available: boolean;
    status: "complete" | "current" | "locked";
  }[];
};

export type AssignmentWithQuizResult = Assignment & {
  quizResult?: QuizResult;
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
  setStep: (step: Assignment["step"]) =>
    apiRequest<Assignment>("/assignment/step", {
      method: "POST",
      body: JSON.stringify({ step }),
    }),
  submitQuiz: (answers: Record<string, string>) =>
    apiRequest<AssignmentWithQuizResult>("/assignment/quiz", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  checkSandbox: (stepId: string, answer: string) =>
    apiRequest<SandboxCheckResult>("/assignment/sandbox-check", {
      method: "POST",
      body: JSON.stringify({ stepId, answer }),
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
  mentorStudents: () =>
    apiRequest<{ students: MentorStudent[] }>("/mentor/students"),
  githubLoginUrl: () => `${API_URL}/auth/github`,
};
