import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StreakPanel } from "./streak-panel";

describe("StreakPanel", () => {
  it("shows streak stats and repo link", () => {
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
  });
});
