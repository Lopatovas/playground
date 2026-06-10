import type { User } from "@prisma/client";
import type { GitHubClient } from "../../clients/github.client.js";
import { getStageContent } from "../curriculum/curriculum.service.js";
import { computeStreak } from "../streak/streak.service.js";

export type StudentAttention = "ok" | "missed_today" | "no_repo" | "inactive";

export type MentorStudentStreak = {
  configured: boolean;
  activeToday: boolean;
  missedToday: boolean;
  currentStreak: number;
  lastActivityDate: string | null;
};

export type MentorStudentRow = {
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
  streak: MentorStudentStreak | null;
  attention: StudentAttention;
};

export function attentionRank(attention: StudentAttention): number {
  const order: Record<StudentAttention, number> = {
    missed_today: 0,
    inactive: 1,
    no_repo: 2,
    ok: 3,
  };
  return order[attention];
}

export function classifyAttention(
  streak: MentorStudentStreak | null,
): StudentAttention {
  if (!streak?.configured) return "no_repo";
  if (streak.lastActivityDate === null) return "inactive";
  if (streak.missedToday) return "missed_today";
  return "ok";
}

export async function fetchStudentStreak(
  github: GitHubClient,
  user: Pick<User, "accessToken" | "repoOwner" | "repoName">,
): Promise<MentorStudentStreak | null> {
  if (!user.repoOwner || !user.repoName) {
    return null;
  }

  const commits = await github.fetchRepoCommits(
    user.accessToken,
    user.repoOwner,
    user.repoName,
  );
  const stats = computeStreak(commits);

  return {
    configured: true,
    activeToday: stats.activeToday,
    missedToday: stats.missedToday,
    currentStreak: stats.currentStreak,
    lastActivityDate: stats.lastActivityDate,
  };
}

export function buildMentorStudentRow(
  user: User,
  streak: MentorStudentStreak | null,
): MentorStudentRow {
  const stage = getStageContent(user.trackId, user.currentStage);
  const repo =
    user.repoOwner && user.repoName
      ? { owner: user.repoOwner, name: user.repoName }
      : null;

  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    trackId: user.trackId,
    currentStage: user.currentStage,
    stageTitle: stage?.title ?? user.currentStage,
    currentStep: user.currentStep,
    quizPassed: user.quizPassed,
    repo,
    repoUrl: repo ? `https://github.com/${repo.owner}/${repo.name}` : null,
    streak,
    attention: classifyAttention(streak),
  };
}

export async function buildMentorRoster(
  students: User[],
  github: GitHubClient,
): Promise<MentorStudentRow[]> {
  const rows = await Promise.all(
    students.map(async (student) => {
      let streak: MentorStudentStreak | null = null;

      try {
        streak = await fetchStudentStreak(github, student);
      } catch {
        streak = student.repoOwner && student.repoName
          ? {
              configured: true,
              activeToday: false,
              missedToday: false,
              currentStreak: 0,
              lastActivityDate: null,
            }
          : null;
      }

      return buildMentorStudentRow(student, streak);
    }),
  );

  return rows.sort((a, b) => {
    const attentionDiff =
      attentionRank(a.attention) - attentionRank(b.attention);
    if (attentionDiff !== 0) return attentionDiff;
    return a.username.localeCompare(b.username);
  });
}
