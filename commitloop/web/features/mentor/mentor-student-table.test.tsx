import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MentorStudentTable } from "./mentor-student-table";
import type { MentorStudent } from "@/lib/api";

const students: MentorStudent[] = [
  {
    id: "1",
    username: "alice",
    avatarUrl: null,
    trackId: "track-1",
    currentStage: "stage-1-git-fundamentals",
    stageTitle: "Stage 1 — Git Fundamentals",
    currentStep: "sandbox",
    quizPassed: false,
    repo: { owner: "alice", name: "app" },
    repoUrl: "https://github.com/alice/app",
    streak: {
      configured: true,
      activeToday: true,
      missedToday: false,
      currentStreak: 5,
      lastActivityDate: "2026-06-10",
    },
    attention: "ok",
  },
  {
    id: "2",
    username: "bob",
    avatarUrl: null,
    trackId: "track-1",
    currentStage: "stage-0-onboarding",
    stageTitle: "Stage 0 — Onboarding",
    currentStep: "project",
    quizPassed: true,
    repo: { owner: "bob", name: "app" },
    repoUrl: "https://github.com/bob/app",
    streak: {
      configured: true,
      activeToday: false,
      missedToday: true,
      currentStreak: 2,
      lastActivityDate: "2026-06-09",
    },
    attention: "missed_today",
  },
];

describe("MentorStudentTable", () => {
  it("renders an empty state", () => {
    render(<MentorStudentTable students={[]} />);

    expect(screen.getByText(/No students yet/)).toBeInTheDocument();
  });

  it("renders student rows with attention and repo links", () => {
    render(<MentorStudentTable students={students} />);

    expect(screen.getByText("@alice")).toBeInTheDocument();
    expect(screen.getByText("@bob")).toBeInTheDocument();
    expect(screen.getByText("Missed today")).toBeInTheDocument();
    expect(screen.getByText("On track")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "alice/app →" }),
    ).toHaveAttribute("href", "https://github.com/alice/app");
    expect(screen.getByText(/quiz passed/)).toBeInTheDocument();
  });
});
