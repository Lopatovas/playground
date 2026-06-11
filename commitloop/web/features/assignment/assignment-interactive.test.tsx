import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssignmentLesson } from "./assignment-lesson";
import { AssignmentSandbox } from "./assignment-sandbox";
import type { LessonPage, SandboxStep } from "@/lib/api";

const pages: LessonPage[] = [
  { id: "why", title: "Why Git", body: "## Why\nVersion control matters." },
  { id: "how", title: "How Git", body: "## How\nUse `git add`." },
];

const steps: SandboxStep[] = [
  {
    id: "init",
    title: "Initialize",
    body: "Run git init.",
    checkpoint: {
      kind: "choice",
      prompt: "What does git init create?",
      choices: [
        { id: "a", text: "A .git directory" },
        { id: "b", text: "A remote" },
      ],
    },
  },
  {
    id: "stage",
    title: "Stage",
    body: "Stage files.",
    checkpoint: {
      kind: "text",
      prompt: "Which command stages all changes?",
      placeholder: "git ...",
    },
  },
];

describe("AssignmentLesson", () => {
  it("paginates lesson pages", async () => {
    const user = userEvent.setup();
    render(<AssignmentLesson pages={pages} />);

    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Why" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next →" }));

    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(
      screen.getByText("Lesson complete — head to the Sandbox tab to practice."),
    ).toBeInTheDocument();
  });

  it("shows placeholder when there are no pages", () => {
    render(<AssignmentLesson pages={[]} />);
    expect(screen.getByText("Lesson content is on its way.")).toBeInTheDocument();
  });
});

describe("AssignmentSandbox", () => {
  it("checks a choice checkpoint and shows feedback", async () => {
    const user = userEvent.setup();
    const onCheck = vi
      .fn()
      .mockResolvedValue({ correct: true, explanation: "git init creates .git." });

    render(<AssignmentSandbox steps={steps} onCheck={onCheck} />);

    expect(screen.getByText("0 / 2 checkpoints passed")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "A .git directory" }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onCheck).toHaveBeenCalledWith("init", "a");
    expect(await screen.findByText("Correct")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 checkpoints passed")).toBeInTheDocument();
  });

  it("checks a text checkpoint", async () => {
    const user = userEvent.setup();
    const onCheck = vi
      .fn()
      .mockResolvedValue({ correct: false, explanation: "Use git add ." });

    render(<AssignmentSandbox steps={steps} onCheck={onCheck} />);

    await user.click(screen.getByRole("button", { name: "Next step →" }));
    await user.type(screen.getByPlaceholderText("git ..."), "git add .");
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(onCheck).toHaveBeenCalledWith("stage", "git add .");
    expect(await screen.findByText("Not quite — try again")).toBeInTheDocument();
  });
});
