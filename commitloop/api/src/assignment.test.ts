import { describe, expect, it } from "vitest";
import { buildAssignment, parseChecklistState } from "./assignment.js";

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
      buildAssignment("track-1", "stage-99-missing", "lesson", "{}"),
    ).toBeNull();
  });

  it("builds stage-0 assignment with lesson step", () => {
    const assignment = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "lesson",
      "{}",
    );
    expect(assignment).not.toBeNull();
    expect(assignment!.stage.slug).toBe("stage-0-onboarding");
    expect(assignment!.step).toBe("lesson");
    expect(assignment!.stepLabel).toBe("Lesson");
    expect(assignment!.checklist.length).toBeGreaterThan(0);
    expect(assignment!.allChecklistDone).toBe(false);
    expect(assignment!.nextHint).toContain("Sandbox");
  });

  it("marks checklist items done from state", () => {
    const base = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      "{}",
    )!;
    const firstId = base.checklist[0]!.id;
    const state = JSON.stringify({ [firstId]: true });

    const partial = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      state,
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
    )!;
    const state = Object.fromEntries(
      base.checklist.map((item) => [item.id, true]),
    );

    const done = buildAssignment(
      "track-1",
      "stage-0-onboarding",
      "project",
      JSON.stringify(state),
    )!;
    expect(done.allChecklistDone).toBe(true);
    expect(done.nextHint).toContain("Git Fundamentals");
  });
});
