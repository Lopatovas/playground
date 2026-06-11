import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssignmentQuiz } from "./assignment-quiz";
import type { Assignment } from "@/lib/api";

function quizAssignment(overrides?: Partial<Assignment>): Assignment {
  return {
    stage: {
      slug: "stage-1-git-fundamentals",
      title: "Stage 1 — Git Fundamentals",
      goal: "Develop daily engineering habits.",
    },
    step: "quiz",
    stepLabel: "Quiz",
    summary: "Answer every question.",
    checklist: [],
    allChecklistDone: false,
    quiz: {
      passScore: 0.8,
      questions: [
        {
          id: "git-add",
          prompt: "What does git add do?",
          choices: [
            { id: "a", text: "Stages changes for the next commit" },
            { id: "b", text: "Pushes to GitHub" },
          ],
        },
        {
          id: "git-log",
          prompt: "What does git log show?",
          choices: [
            { id: "a", text: "Commit history" },
            { id: "b", text: "Remote branches" },
          ],
        },
      ],
    },
    quizPassed: false,
    canAccessProject: false,
    nextHint: "Pass the quiz to unlock the project step",
    content: {
      lesson: { pages: [] },
      sandbox: { steps: [] },
      project: "",
    },
    track: [],
    ...overrides,
  };
}

describe("AssignmentQuiz", () => {
  it("shows unlocked message when quiz already passed", () => {
    render(
      <AssignmentQuiz
        assignment={quizAssignment({ quizPassed: true })}
        busy={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Quiz passed. Project step unlocked."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Submit quiz" })).toBeNull();
  });

  it("shows pass threshold and keeps submit disabled until all questions answered", async () => {
    const user = userEvent.setup();

    render(
      <AssignmentQuiz
        assignment={quizAssignment()}
        busy={false}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText(/80% or higher/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit quiz" })).toBeDisabled();

    await user.click(
      screen.getByRole("radio", { name: "Stages changes for the next commit" }),
    );
    expect(screen.getByRole("button", { name: "Submit quiz" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Commit history" }));
    expect(screen.getByRole("button", { name: "Submit quiz" })).toBeEnabled();
  });

  it("submits selected answers and shows fail feedback with explanations", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({
      score: 0.5,
      passed: false,
      results: [
        {
          questionId: "git-add",
          correct: false,
          explanation: "git add stages files; push sends commits.",
        },
        { questionId: "git-log", correct: true, explanation: "Correct." },
      ],
    });

    render(
      <AssignmentQuiz
        assignment={quizAssignment()}
        busy={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole("radio", { name: "Pushes to GitHub" }),
    );
    await user.click(screen.getByRole("radio", { name: "Commit history" }));
    await user.click(screen.getByRole("button", { name: "Submit quiz" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        "git-add": "b",
        "git-log": "a",
      });
    });

    expect(screen.getByText("Score: 50% — try again")).toBeInTheDocument();
    expect(
      screen.getByText("git add stages files; push sends commits."),
    ).toBeInTheDocument();
  });

  it("shows pass score after a successful submit", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({
      score: 1,
      passed: true,
      results: [
        { questionId: "git-add", correct: true, explanation: "Correct." },
        { questionId: "git-log", correct: true, explanation: "Correct." },
      ],
    });

    render(
      <AssignmentQuiz
        assignment={quizAssignment()}
        busy={false}
        onSubmit={onSubmit}
      />,
    );

    await user.click(
      screen.getByRole("radio", { name: "Stages changes for the next commit" }),
    );
    await user.click(screen.getByRole("radio", { name: "Commit history" }));
    await user.click(screen.getByRole("button", { name: "Submit quiz" }));

    expect(await screen.findByText("Score: 100% — passed")).toBeInTheDocument();
  });

  it("disables inputs and shows checking label while busy", async () => {
    const user = userEvent.setup();

    render(
      <AssignmentQuiz
        assignment={quizAssignment()}
        busy
        onSubmit={vi.fn()}
      />,
    );

    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).toBeDisabled();
    }

    await user.click(
      screen.getByRole("radio", { name: "Stages changes for the next commit" }),
    );
    expect(
      screen.getByRole("button", { name: "Checking…" }),
    ).toBeDisabled();
  });
});
