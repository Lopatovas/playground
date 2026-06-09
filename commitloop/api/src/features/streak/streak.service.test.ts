import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeStreak } from "./streak.service.js";

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
    const stats = computeStreak([commit("2025-06-06"), commit("2025-06-07")]);
    expect(stats.activeToday).toBe(false);
    expect(stats.missedToday).toBe(true);
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it("resets current streak when a weekday gap has no commit", () => {
    const stats = computeStreak([commit("2025-06-05")]);
    expect(stats.currentStreak).toBe(0);
    expect(stats.missedToday).toBe(true);
  });

  it("counts weekend gaps without breaking streak", () => {
    vi.setSystemTime(new Date("2025-06-10T15:00:00Z"));

    const stats = computeStreak([
      commit("2025-06-06"),
      commit("2025-06-09"),
      commit("2025-06-10"),
    ]);

    expect(stats.currentStreak).toBe(3);
    expect(stats.longestStreak).toBe(3);
    expect(stats.activeToday).toBe(true);
  });

  it("does not extend current streak across a missed weekday", () => {
    vi.setSystemTime(new Date("2025-06-10T15:00:00Z"));

    const stats = computeStreak([commit("2025-06-06"), commit("2025-06-09")]);

    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(2);
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
