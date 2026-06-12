import { describe, expect, it } from "vitest";
import {
  getStageContent,
  getTrackOverview,
  getTrackStages,
  gradeQuiz,
  nextStageSlug,
  sanitizeQuizForClient,
  stepLabel,
} from "./curriculum.service.js";

describe("curriculum", () => {
  it("lists track 1 stages from track.json", () => {
    const stages = getTrackStages("track-1");
    expect(stages.length).toBeGreaterThanOrEqual(2);
    expect(stages[0]?.slug).toBe("stage-0-onboarding");
  });

  it("loads hybrid stage content", () => {
    const stage = getStageContent("track-1", "stage-0-onboarding");
    expect(stage).not.toBeNull();
    expect(stage!.title).toContain("Onboarding");
    const lessonText = stage!.lesson.pages.map((p) => p.body).join("\n");
    expect(lessonText).toContain("GitHub");
    expect(stage!.checklist.length).toBeGreaterThan(0);
    expect(stage!.quiz.questions.length).toBeGreaterThan(0);
  });

  it("returns null for missing stage folder", () => {
    expect(getStageContent("track-1", "stage-does-not-exist")).toBeNull();
  });

  it("marks current and complete stages in overview", () => {
    const overview = getTrackOverview("track-1", "stage-1-git-fundamentals");
    const stage0 = overview.find((s) => s.slug === "stage-0-onboarding");
    const stage1 = overview.find((s) => s.slug === "stage-1-git-fundamentals");
    const stage2 = overview.find((s) => s.slug === "stage-2-frontend");

    expect(stage0?.status).toBe("complete");
    expect(stage1?.status).toBe("current");
    expect(stage2?.status).toBe("locked");
  });

  it("returns empty overview for unknown track", () => {
    expect(getTrackOverview("track-99", "stage-0-onboarding")).toEqual([]);
  });

  it("advances to next available stage", () => {
    expect(nextStageSlug("track-1", "stage-0-onboarding")).toBe(
      "stage-1-git-fundamentals",
    );
    expect(nextStageSlug("track-1", "stage-1-git-fundamentals")).toBe(
      "stage-2-frontend",
    );
  });

  it("labels steps for display", () => {
    expect(stepLabel("lesson")).toBe("Lesson");
    expect(stepLabel("sandbox")).toBe("Sandbox Task");
    expect(stepLabel("quiz")).toBe("Quiz");
    expect(stepLabel("project")).toBe("Project Implementation");
  });

  it("grades quiz server-side", () => {
    const stage = getStageContent("track-1", "stage-1-git-fundamentals")!;
    const answers = Object.fromEntries(
      stage.quiz.questions.map((q) => [q.id, q.correctChoiceId]),
    );

    const graded = gradeQuiz(stage, answers);
    expect(graded.passed).toBe(true);
    expect(graded.score).toBe(1);
  });

  it("fails quiz below pass threshold and returns explanations", () => {
    const stage = getStageContent("track-1", "stage-1-git-fundamentals")!;
    const answers = Object.fromEntries(
      stage.quiz.questions.map((q) => [q.id, "b"]),
    );

    const graded = gradeQuiz(stage, answers);
    expect(graded.passed).toBe(false);
    expect(graded.score).toBeLessThan(stage.quiz.passScore);
    expect(graded.results.some((r) => !r.correct && r.explanation)).toBe(true);
  });

  it("strips correct answers for client-safe quiz payload", () => {
    const stage = getStageContent("track-1", "stage-0-onboarding")!;
    const clientQuiz = sanitizeQuizForClient(stage);

    expect(clientQuiz.passScore).toBe(stage.quiz.passScore);
    expect(clientQuiz.questions).toHaveLength(stage.quiz.questions.length);
    for (const question of clientQuiz.questions) {
      expect(question).not.toHaveProperty("correctChoiceId");
      expect(question).not.toHaveProperty("explanation");
    }
  });
});
