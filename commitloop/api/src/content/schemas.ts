import { z } from "zod";

const kebabId = (label: string) =>
  z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, `${label} must be kebab-case`);

export const checklistItemSchema = z.object({
  id: kebabId("checklist id"),
  label: z.string().min(1),
});

export const quizChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const quizQuestionSchema = z.object({
  id: kebabId("question id"),
  prompt: z.string().min(1),
  choices: z.array(quizChoiceSchema).min(2),
  correctChoiceId: z.string().min(1),
  explanation: z.string().min(1),
});

export const quizSchema = z
  .object({
    passScore: z.number().min(0).max(1),
    questions: z.array(quizQuestionSchema).min(1),
  })
  .superRefine((quiz, ctx) => {
    for (const question of quiz.questions) {
      const choiceIds = new Set(question.choices.map((c) => c.id));
      if (!choiceIds.has(question.correctChoiceId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `question "${question.id}" correctChoiceId must match a choice id`,
        });
      }
    }
  });

export const lessonPageSchema = z.object({
  id: kebabId("lesson page id"),
  title: z.string().min(1),
  file: z.string().min(1),
});

export const lessonSchema = z.object({
  pages: z.array(lessonPageSchema).min(1),
});

// Discriminated-union members must be plain objects (no refinements), so the
// "correctChoiceId points at a real choice" rule is enforced in
// stageManifestSchema below.
export const sandboxChoiceCheckpointSchema = z.object({
  kind: z.literal("choice"),
  prompt: z.string().min(1),
  choices: z.array(quizChoiceSchema).min(2),
  correctChoiceId: z.string().min(1),
  explanation: z.string().min(1),
});

export const sandboxTextCheckpointSchema = z.object({
  kind: z.literal("text"),
  prompt: z.string().min(1),
  placeholder: z.string().min(1).optional(),
  accept: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(1),
});

export const sandboxCheckpointSchema = z.discriminatedUnion("kind", [
  sandboxChoiceCheckpointSchema,
  sandboxTextCheckpointSchema,
]);

export const sandboxStepSchema = z.object({
  id: kebabId("sandbox step id"),
  title: z.string().min(1),
  file: z.string().min(1),
  checkpoint: sandboxCheckpointSchema.optional(),
});

export const sandboxSchema = z.object({
  intro: z.string().min(1).optional(),
  steps: z.array(sandboxStepSchema).min(1),
});

export const stageManifestSchema = z
  .object({
    slug: z.string().min(1),
    title: z.string().min(1),
    goal: z.string().min(1),
    summary: z.string().min(1).optional(),
    estimatedMinutes: z.number().int().positive().optional(),
    nextStage: z.string().min(1).optional(),
    lesson: lessonSchema,
    sandbox: sandboxSchema,
    checklist: z.array(checklistItemSchema).min(1),
    quiz: quizSchema,
  })
  .superRefine((stage, ctx) => {
    for (const step of stage.sandbox.steps) {
      if (step.checkpoint?.kind === "choice") {
        const choiceIds = new Set(step.checkpoint.choices.map((c) => c.id));
        if (!choiceIds.has(step.checkpoint.correctChoiceId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `sandbox step "${step.id}" correctChoiceId must match a choice id`,
          });
        }
      }
    }
  });

export const trackStageRefSchema = z.object({
  slug: z.string().min(1),
  order: z.number().int().nonnegative(),
  available: z.boolean(),
});

export const trackManifestSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  stages: z.array(trackStageRefSchema).min(1),
});

export type TrackManifest = z.infer<typeof trackManifestSchema>;
export type StageManifest = z.infer<typeof stageManifestSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type SandboxCheckpoint = z.infer<typeof sandboxCheckpointSchema>;
export type LessonPageRef = z.infer<typeof lessonPageSchema>;
export type SandboxStepRef = z.infer<typeof sandboxStepSchema>;

export type LoadedLessonPage = {
  id: string;
  title: string;
  body: string;
};

export type LoadedSandboxStep = {
  id: string;
  title: string;
  body: string;
  checkpoint?: SandboxCheckpoint;
};

export type LoadedStage = {
  slug: string;
  title: string;
  goal: string;
  summary?: string;
  estimatedMinutes?: number;
  nextStage?: string;
  lesson: { pages: LoadedLessonPage[] };
  sandbox: { intro?: string; steps: LoadedSandboxStep[] };
  project: string;
  projectSummary: string;
  checklist: StageManifest["checklist"];
  quiz: StageManifest["quiz"];
};
