import { describe, expect, it } from "vitest";
import { loadStageContent, loadStageManifest } from "./stage-loader.js";
import { loadTrackManifest } from "./track-loader.js";
import { validateAllContent } from "./validate.js";

describe("content loader", () => {
  it("loads track manifest", () => {
    const track = loadTrackManifest("track-1");
    expect(track?.id).toBe("track-1");
    expect(track?.stages.length).toBeGreaterThanOrEqual(2);
  });

  it("loads stage markdown and manifest", () => {
    const stage = loadStageContent("track-1", "stage-1-git-fundamentals");
    expect(stage?.lesson).toContain("git add");
    expect(stage?.quiz.questions.length).toBeGreaterThanOrEqual(3);
  });

  it("validates all shipped content", () => {
    expect(validateAllContent()).toEqual([]);
  });

  it("returns null when stage folder is missing", () => {
    expect(loadStageContent("track-1", "stage-does-not-exist")).toBeNull();
    expect(loadStageManifest("track-1", "stage-does-not-exist")).toBeNull();
  });

  it("rejects unavailable stages via curriculum service boundary", () => {
    const locked = loadStageContent("track-1", "stage-2-end-to-end");
    expect(locked).toBeNull();
  });
});
