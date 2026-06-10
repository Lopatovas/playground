import { describe, expect, it } from "vitest";
import {
  buildAssignment,
  parseChecklistState,
  parseQuizState,
} from "./assignment.service.js";

describe("parseQuizState", () => {
  it("parses valid JSON", () => {
    expect(parseQuizState('{"git-add":"a"}')).toEqual({ "git-add": "a" });
  });

  it("returns empty object for invalid JSON", () => {
    expect(parseQuizState("not-json")).toEqual({});
  });
});

describe("parseChecklistState", () => {
  it("parses valid JSON", () => {
    expect(parseChecklistState('{"a":true,"b":false}')).toEqual({
      a: true,
      b: false,
    });
  });

  it("returns empty object for invalid JSON", () => {
    expect(parseChecklistState("not-json")).toEqual({});
  });
});

describe("buildAssignment", () => {
  it("returns null for unknown stage", () => {
    expect(
      buildAssignment("track-1", "stage-99-missing", "lesson", "{}", false),
    ).toBeNull();
  });

  it("builds stage-0 assignment with lesson step", () => {
    const assignment = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "lesson",
      "{}",
      false,
    );
    expect(assignment).not.toBeNull();
    expect(assignment!.stage.slug).toBe("stage-0-onboarding");
    expect(assignment!.step).toBe("lesson");
    expect(assignment!.stepLabel).toBe("Lesson");
    expect(assignment!.checklist.length).toBeGreaterThan(0);
    expect(assignment!.quiz.questions.length).toBeGreaterThan(0);
    expect(assignment!.allChecklistDone).toBe(false);
    expect(assignment!.canAccessProject).toBe(false);
    expect(assignment!.nextHint).toContain("Sandbox");
  });

  it("marks checklist items done from state", () => {
    const base = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      "{}",
      true,
    )!;
    const firstId = base.checklist[0]!.id;
    const state = JSON.stringify({ [firstId]: true });

    const partial = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      state,
      true,
    )!;
    expect(partial.checklist[0]?.done).toBe(true);
    expect(partial.allChecklistDone).toBe(false);
  });

  it("hints to advance when project checklist is complete", () => {
    const base = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      "{}",
      true,
    )!;
    const state = Object.fromEntries(
      base.checklist.map((item) => [item.id, true]),
    );

    const done = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      JSON.stringify(state),
      true,
    )!;
    expect(done.allChecklistDone).toBe(true);
    expect(done.nextHint).toContain("Git Fundamentals");
  });

  it("hints quiz after sandbox and blocks project access until passed", () => {
    const sandbox = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "sandbox",
      "{}",
      false,
    )!;
    expect(sandbox.nextHint).toContain("Quiz");

    const quizLocked = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "quiz",
      "{}",
      false,
    )!;
    expect(quizLocked.nextHint).toContain("Pass the quiz");
    expect(quizLocked.canAccessProject).toBe(false);

    const quizPassed = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "quiz",
      "{}",
      true,
    )!;
    expect(quizPassed.nextHint).toContain("Project");
    expect(quizPassed.canAccessProject).toBe(true);
  });

  it("omits correct answers from quiz payload sent to clients", () => {
    const assignment = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "quiz",
      "{}",
      false,
    )!;

    for (const question of assignment.quiz.questions) {
      expect(question).not.toHaveProperty("correctChoiceId");
      expect(question).not.toHaveProperty("explanation");
    }
  });
});
