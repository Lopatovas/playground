import { describe, expect, it, vi } from "vitest";
import {
  attentionRank,
  buildMentorStudentRow,
  classifyAttention,
} from "./mentor.service.js";

const baseUser = {
  id: "user-1",
  githubId: 111,
  username: "student",
  avatarUrl: null,
  accessToken: "token",
  repoOwner: "student",
  repoName: "app",
  trackId: "track-1",
  currentStage: "stage-0-onboarding",
  currentStep: "lesson",
  checklistState: "{}",
  quizState: "{}",
  quizPassed: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("mentor service", () => {
  it("classifies attention states", () => {
    expect(classifyAttention(null)).toBe("no_repo");
    expect(
      classifyAttention({
        configured: true,
        activeToday: false,
        missedToday: false,
        currentStreak: 0,
        lastActivityDate: null,
      }),
    ).toBe("inactive");
    expect(
      classifyAttention({
        configured: true,
        activeToday: false,
        missedToday: true,
        currentStreak: 3,
        lastActivityDate: "2026-06-09",
      }),
    ).toBe("missed_today");
    expect(
      classifyAttention({
        configured: true,
        activeToday: true,
        missedToday: false,
        currentStreak: 3,
        lastActivityDate: "2026-06-10",
      }),
    ).toBe("ok");
  });

  it("sorts missed today ahead of ok", () => {
    expect(attentionRank("missed_today")).toBeLessThan(attentionRank("ok"));
    expect(attentionRank("no_repo")).toBeGreaterThan(
      attentionRank("missed_today"),
    );
  });

  it("builds mentor student rows with stage title and repo url", () => {
    const row = buildMentorStudentRow(baseUser, {
      configured: true,
      activeToday: true,
      missedToday: false,
      currentStreak: 2,
      lastActivityDate: "2026-06-10",
    });

    expect(row.stageTitle).toContain("Onboarding");
    expect(row.repoUrl).toBe("https://github.com/student/app");
    expect(row.attention).toBe("ok");
    expect(row.quizPassed).toBe(false);
  });

  it("handles missing stage content gracefully", () => {
    const row = buildMentorStudentRow(
      { ...baseUser, currentStage: "stage-unknown" },
      null,
    );

    expect(row.stageTitle).toBe("stage-unknown");
    expect(row.attention).toBe("no_repo");
  });
});

describe("buildMentorRoster", () => {
  it("sorts students by attention priority", async () => {
    const { buildMentorRoster } = await import("./mentor.service.js");
    const github = {
      fetchRepoCommits: vi
        .fn()
        .mockResolvedValueOnce([
          {
            commit: {
              author: { date: "2026-06-10T10:00:00Z" },
              message: "work",
            },
          },
        ])
        .mockResolvedValueOnce([]),
    };

    const roster = await buildMentorRoster(
      [
        baseUser,
        {
          ...baseUser,
          id: "user-2",
          username: "alice",
          repoOwner: "alice",
          repoName: "app",
        },
      ],
      github as never,
    );

    expect(roster[0]?.username).toBe("alice");
    expect(roster[0]?.attention).toBe("inactive");
    expect(roster[1]?.attention).toBe("ok");
  });
});
