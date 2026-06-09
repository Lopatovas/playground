import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildHeatmapDays,
  heatmapCellClass,
  isWeekendUTC,
  StreakPanel,
} from "./streak-panel";

describe("buildHeatmapDays", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-08T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fills the last 7 UTC calendar days including empty days", () => {
    const days = buildHeatmapDays([
      { date: "2025-06-08", count: 2, messages: [] },
      { date: "2025-06-06", count: 1, messages: [] },
    ]);

    expect(days).toHaveLength(7);
    expect(days.map((d) => d.date)).toEqual([
      "2025-06-02",
      "2025-06-03",
      "2025-06-04",
      "2025-06-05",
      "2025-06-06",
      "2025-06-07",
      "2025-06-08",
    ]);
    expect(days.find((d) => d.date === "2025-06-07")?.count).toBe(0);
    expect(days.find((d) => d.date === "2025-06-08")?.count).toBe(2);
  });

  it("marks weekday misses but not weekends", () => {
    expect(isWeekendUTC("2025-06-07")).toBe(true);
    expect(isWeekendUTC("2025-06-05")).toBe(false);
    expect(heatmapCellClass({ date: "2025-06-05", count: 0 })).toBe(
      "heat miss",
    );
    expect(heatmapCellClass({ date: "2025-06-07", count: 0 })).toBe("heat");
  });
});

describe("StreakPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-08T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows streak stats, repo link, and heatmap tooltips", () => {
    render(
      <StreakPanel
        stats={{
          activeToday: true,
          missedToday: false,
          currentStreak: 5,
          longestStreak: 12,
          totalCommits: 40,
          lastActivityDate: "2025-06-08",
          recentDays: [{ date: "2025-06-08", count: 2, messages: ["fix bug"] }],
        }}
        repo={{ owner: "acme", name: "my-app" }}
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /acme\/my-app/i })).toHaveAttribute(
      "href",
      "https://github.com/acme/my-app",
    );

    const cells = document.querySelectorAll(".heat");
    expect(cells).toHaveLength(7);
    expect(cells[6]).toHaveAttribute(
      "data-tooltip",
      expect.stringContaining("2 commits"),
    );
    expect(cells[5]).toHaveClass("heat");
    expect(cells[5]).not.toHaveClass("miss");
    expect(cells[4]).toHaveClass("miss");
  });
});
