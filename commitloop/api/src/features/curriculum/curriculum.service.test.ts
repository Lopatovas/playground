import { describe, expect, it } from "vitest";
import {
  getStageContent,
  getTrackOverview,
  nextStageSlug,
  stepLabel,
  TRACK_1_STAGES,
} from "./curriculum.service.js";

describe("curriculum", () => {
  it("lists track 1 stages", () => {
    expect(TRACK_1_STAGES.length).toBeGreaterThanOrEqual(2);
    expect(TRACK_1_STAGES[0]?.slug).toBe("stage-0-onboarding");
  });

  it("loads stage markdown content", () => {
    const stage = getStageContent("stage-0-onboarding");
    expect(stage).not.toBeNull();
    expect(stage!.title).toContain("Onboarding");
    expect(stage!.lesson).toContain("GitHub");
    expect(stage!.checklist.length).toBeGreaterThan(0);
  });

  it("returns null for missing stage file", () => {
    expect(getStageContent("stage-does-not-exist")).toBeNull();
  });

  it("marks current and complete stages in overview", () => {
    const overview = getTrackOverview("track-1", "stage-1-git-fundamentals");
    const stage0 = overview.find((s) => s.slug === "stage-0-onboarding");
    const stage1 = overview.find((s) => s.slug === "stage-1-git-fundamentals");
    const stage2 = overview.find((s) => s.slug === "stage-2-end-to-end");

    expect(stage0?.status).toBe("complete");
    expect(stage1?.status).toBe("current");
    expect(stage2?.status).toBe("locked");
  });

  it("returns empty overview for unknown track", () => {
    expect(getTrackOverview("track-99", "stage-0-onboarding")).toEqual([]);
  });

  it("advances to next available stage", () => {
    expect(nextStageSlug("stage-0-onboarding")).toBe(
      "stage-1-git-fundamentals",
    );
    expect(nextStageSlug("stage-1-git-fundamentals")).toBeNull();
  });

  it("labels steps for display", () => {
    expect(stepLabel("lesson")).toBe("Lesson");
    expect(stepLabel("sandbox")).toBe("Sandbox Task");
    expect(stepLabel("project")).toBe("Project Implementation");
  });
});
