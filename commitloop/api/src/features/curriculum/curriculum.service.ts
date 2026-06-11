import {
  getStageContentForTrack,
  listTrackStageRefs,
  loadTrackManifest,
} from "../../content/track-loader.js";
import type { LoadedStage } from "../../content/schemas.js";

export type Step = "lesson" | "sandbox" | "quiz" | "project";

export type ClientCheckpoint =
  | {
      kind: "choice";
      prompt: string;
      choices: { id: string; text: string }[];
    }
  | {
      kind: "text";
      prompt: string;
      placeholder?: string;
    };

export type StageMeta = {
  slug: string;
  title: string;
  available: boolean;
};

export function getTrackStages(trackId: string): StageMeta[] {
  const track = loadTrackManifest(trackId);
  if (!track) return [];

  return listTrackStageRefs(trackId).map((stage) => ({
    slug: stage.slug,
    title: getStageContent(trackId, stage.slug)?.title ?? stage.slug,
    available: stage.available,
  }));
}

export function getStageContent(
  trackId: string,
  slug: string,
): LoadedStage | null {
  const track = loadTrackManifest(trackId);
  if (!track) return null;

  const stageRef = track.stages.find((s) => s.slug === slug);
  if (!stageRef?.available) return null;

  return getStageContentForTrack(trackId, slug);
}

export function getTrackOverview(trackId: string, currentStage: string) {
  const stages = listTrackStageRefs(trackId);
  if (stages.length === 0) return [];

  const currentIdx = stages.findIndex((s) => s.slug === currentStage);

  return stages.map((stage, i) => {
    const content = getStageContent(trackId, stage.slug);
    let status: "complete" | "current" | "locked" = "locked";

    if (!stage.available || !content) {
      status = "locked";
    } else if (stage.slug === currentStage) {
      status = "current";
    } else if (currentIdx >= 0 && i < currentIdx) {
      status = "complete";
    }

    return {
      slug: stage.slug,
      title: content?.title ?? stage.slug,
      available: stage.available,
      status,
    };
  });
}

export function nextStageSlug(
  trackId: string,
  current: string,
): string | null {
  const stages = listTrackStageRefs(trackId);
  const idx = stages.findIndex((s) => s.slug === current);
  if (idx < 0) return null;

  const next = stages[idx + 1];
  if (!next?.available) return null;

  return getStageContent(trackId, next.slug) ? next.slug : null;
}

export function stepLabel(step: Step): string {
  const labels: Record<Step, string> = {
    lesson: "Lesson",
    sandbox: "Sandbox Task",
    quiz: "Quiz",
    project: "Project Implementation",
  };
  return labels[step];
}

export function sanitizeQuizForClient(stage: LoadedStage) {
  return {
    passScore: stage.quiz.passScore,
    questions: stage.quiz.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      choices: question.choices,
    })),
  };
}

export function sanitizeLessonForClient(stage: LoadedStage) {
  return {
    pages: stage.lesson.pages.map((page) => ({
      id: page.id,
      title: page.title,
      body: page.body,
    })),
  };
}

function clientCheckpoint(
  checkpoint: NonNullable<LoadedStage["sandbox"]["steps"][number]["checkpoint"]>,
): ClientCheckpoint {
  if (checkpoint.kind === "choice") {
    return {
      kind: "choice",
      prompt: checkpoint.prompt,
      choices: checkpoint.choices,
    };
  }
  return {
    kind: "text",
    prompt: checkpoint.prompt,
    placeholder: checkpoint.placeholder,
  };
}

export function sanitizeSandboxForClient(stage: LoadedStage) {
  return {
    intro: stage.sandbox.intro,
    steps: stage.sandbox.steps.map((step) => ({
      id: step.id,
      title: step.title,
      body: step.body,
      checkpoint: step.checkpoint ? clientCheckpoint(step.checkpoint) : undefined,
    })),
  };
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[`'"]/g, "")
    .replace(/\s+/g, " ");
}

export function gradeSandboxCheckpoint(
  stage: LoadedStage,
  stepId: string,
  answer: string,
): { correct: boolean; explanation: string } | null {
  const step = stage.sandbox.steps.find((s) => s.id === stepId);
  if (!step?.checkpoint) return null;

  const checkpoint = step.checkpoint;
  if (checkpoint.kind === "choice") {
    return {
      correct: answer === checkpoint.correctChoiceId,
      explanation: checkpoint.explanation,
    };
  }

  const normalized = normalizeText(answer);
  const correct = checkpoint.accept.some(
    (accepted) => normalizeText(accepted) === normalized,
  );
  return { correct, explanation: checkpoint.explanation };
}

export function gradeQuiz(
  stage: LoadedStage,
  answers: Record<string, string>,
): {
  score: number;
  passed: boolean;
  results: {
    questionId: string;
    correct: boolean;
    explanation: string;
  }[];
} {
  const questions = stage.quiz.questions;
  const results = questions.map((question) => {
    const chosen = answers[question.id];
    const correct = chosen === question.correctChoiceId;
    return {
      questionId: question.id,
      correct,
      explanation: question.explanation,
    };
  });

  const score =
    questions.length === 0
      ? 0
      : results.filter((r) => r.correct).length / questions.length;

  return {
    score,
    passed: score >= stage.quiz.passScore,
    results,
  };
}
