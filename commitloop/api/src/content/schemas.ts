import { z } from "zod";

export const checklistItemSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "checklist id must be kebab-case"),
  label: z.string().min(1),
});

export const quizChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

export const quizQuestionSchema = z.object({
  id: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "question id must be kebab-case"),
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

export const stageManifestSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  goal: z.string().min(1),
  nextStage: z.string().min(1).optional(),
  checklist: z.array(checklistItemSchema).min(1),
  quiz: quizSchema,
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

export type LoadedStage = StageManifest & {
  lesson: string;
  sandbox: string;
  project: string;
  projectSummary: string;
};
