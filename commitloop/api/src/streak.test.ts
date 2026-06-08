import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeStreak, fetchRepoCommits } from "./streak.js";

function commit(date: string, message = "work") {
  return { commit: { author: { date: `${date}T12:00:00Z` }, message } };
}

describe("computeStreak", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-08T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns zeros for no commits", () => {
    const stats = computeStreak([]);
    expect(stats).toEqual({
      activeToday: false,
      missedToday: false,
      currentStreak: 0,
      longestStreak: 0,
      totalCommits: 0,
      lastActivityDate: null,
      recentDays: [],
    });
  });

  it("marks activeToday when committed today", () => {
    const stats = computeStreak([commit("2025-06-08")]);
    expect(stats.activeToday).toBe(true);
    expect(stats.missedToday).toBe(false);
    expect(stats.currentStreak).toBe(1);
    expect(stats.totalCommits).toBe(1);
  });

  it("counts consecutive-day streak ending yesterday", () => {
    const stats = computeStreak([
      commit("2025-06-06"),
      commit("2025-06-07"),
    ]);
    expect(stats.activeToday).toBe(false);
    expect(stats.missedToday).toBe(true);
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it("resets current streak when last commit is older than yesterday", () => {
    const stats = computeStreak([commit("2025-06-05")]);
    expect(stats.currentStreak).toBe(0);
    expect(stats.missedToday).toBe(true);
  });

  it("computes longest streak across a gap", () => {
    const stats = computeStreak([
      commit("2025-06-01"),
      commit("2025-06-02"),
      commit("2025-06-03"),
      commit("2025-06-05"),
      commit("2025-06-06"),
      commit("2025-06-07"),
      commit("2025-06-08"),
    ]);
    expect(stats.longestStreak).toBe(4);
    expect(stats.currentStreak).toBe(4);
  });

  it("aggregates multiple commits on the same day", () => {
    const stats = computeStreak([
      commit("2025-06-08", "first"),
      commit("2025-06-08", "second"),
    ]);
    expect(stats.totalCommits).toBe(2);
    expect(stats.recentDays).toHaveLength(1);
    expect(stats.recentDays[0]?.count).toBe(2);
    expect(stats.recentDays[0]?.messages).toEqual(["first", "second"]);
  });

  it("caps stored messages at five per day", () => {
    const stats = computeStreak(
      Array.from({ length: 7 }, (_, i) => commit("2025-06-08", `msg-${i}`)),
    );
    expect(stats.recentDays[0]?.messages).toHaveLength(5);
  });
});

describe("fetchRepoCommits", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("paginates until an empty page", async () => {
    const page1 = Array.from({ length: 100 }, () => commit("2025-06-01"));
    const page2 = [commit("2025-06-02")];

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        }),
    );

    const commits = await fetchRepoCommits("token", "owner", "repo");
    expect(commits).toHaveLength(101);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws when GitHub returns an error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => "forbidden",
      }),
    );

    await expect(fetchRepoCommits("token", "owner", "repo")).rejects.toThrow(
      "GitHub API 403",
    );
  });
});
