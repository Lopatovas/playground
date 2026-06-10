import {
  getStageContent,
  getTrackOverview,
  nextStageSlug,
  sanitizeQuizForClient,
  stepLabel,
  type Step,
} from "../curriculum/curriculum.service.js";

export type ChecklistState = Record<string, boolean>;
export type QuizState = Record<string, string>;

export function parseChecklistState(json: string): ChecklistState {
  try {
    return JSON.parse(json) as ChecklistState;
  } catch {
    return {};
  }
}

export function parseQuizState(json: string): QuizState {
  try {
    return JSON.parse(json) as QuizState;
  } catch {
    return {};
  }
}

export function buildAssignment(
  trackId: string,
  currentStage: string,
  currentStep: Step,
  checklistJson: string,
  quizPassed: boolean,
) {
  const stage = getStageContent(trackId, currentStage);
  if (!stage) {
    return null;
  }

  const checklistState = parseChecklistState(checklistJson);
  const checklist = stage.checklist.map((item) => ({
    ...item,
    done: Boolean(checklistState[item.id]),
  }));

  const allDone = checklist.length > 0 && checklist.every((item) => item.done);
  const canAccessProject = quizPassed;

  let nextHint = "";
  if (currentStep === "lesson") {
    nextHint = "Up next: Sandbox — practice in isolation";
  } else if (currentStep === "sandbox") {
    nextHint = "Up next: Quiz — check your understanding";
  } else if (currentStep === "quiz") {
    nextHint = quizPassed
      ? "Up next: Project — apply it in your codebase"
      : "Pass the quiz to unlock the project step";
  } else if (!allDone) {
    nextHint = "Finish the checklist, then advance to the next stage";
  } else {
    const next = nextStageSlug(trackId, currentStage);
    nextHint = next
      ? `Ready for ${getStageContent(trackId, next)?.title ?? "next stage"}`
      : "Stage complete — more content coming soon";
  }

  return {
    stage: {
      slug: stage.slug,
      title: stage.title,
      goal: stage.goal,
    },
    step: currentStep,
    stepLabel: stepLabel(currentStep),
    summary:
      currentStep === "project"
        ? stage.projectSummary || stage.goal
        : firstLineForStep(stage, currentStep),
    checklist,
    allChecklistDone: allDone,
    quiz: sanitizeQuizForClient(stage),
    quizPassed,
    canAccessProject,
    nextHint,
    content: {
      lesson: stage.lesson,
      sandbox: stage.sandbox,
      project: stage.project,
    },
    track: getTrackOverview(trackId, currentStage),
  };
}

function firstLineForStep(
  stage: NonNullable<ReturnType<typeof getStageContent>>,
  step: Step,
): string {
  const text =
    step === "lesson"
      ? stage.lesson
      : step === "sandbox"
        ? stage.sandbox
        : step === "quiz"
          ? "Answer every question. You need 80% or higher to unlock the project step."
          : stage.project;
  return (
    text
      .split("\n")
      .find((l) => l.trim() && !l.startsWith("#"))
      ?.trim() ?? stage.goal
  );
}
