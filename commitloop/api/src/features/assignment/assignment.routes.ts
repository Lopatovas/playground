import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getStageContent,
  gradeQuiz,
  nextStageSlug,
  type Step,
} from "../curriculum/curriculum.service.js";
import {
  buildAssignment,
  parseChecklistState,
} from "./assignment.service.js";

const STEPS: Step[] = ["lesson", "sandbox", "quiz", "project"];

export function createAssignmentRouter(prisma: PrismaClient) {
  const router = Router();

  router.get("/assignment/current", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const assignment = buildAssignment(
      user.trackId,
      user.currentStage,
      user.currentStep as Step,
      user.checklistState,
      user.quizPassed,
    );

    if (!assignment) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }

    res.json(assignment);
  });

  router.post("/assignment/step", requireAuth, async (req, res) => {
    const { step } = req.body as { step?: Step };
    if (!step || !STEPS.includes(step)) {
      res.status(400).json({ error: "Invalid step" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (step === "project" && !user.quizPassed) {
      res.status(400).json({ error: "Pass the quiz before opening the project step" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { currentStep: step },
    });

    res.json(
      buildAssignment(
        updated.trackId,
        updated.currentStage,
        updated.currentStep as Step,
        updated.checklistState,
        updated.quizPassed,
      ),
    );
  });

  router.post("/assignment/quiz", requireAuth, async (req, res) => {
    const { answers } = req.body as { answers?: Record<string, string> };
    if (!answers || typeof answers !== "object") {
      res.status(400).json({ error: "answers object required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const stage = getStageContent(user.trackId, user.currentStage);
    if (!stage) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }

    const graded = gradeQuiz(stage, answers);
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        quizState: JSON.stringify(answers),
        quizPassed: graded.passed,
        currentStep: graded.passed ? "project" : "quiz",
      },
    });

    res.json({
      ...buildAssignment(
        updated.trackId,
        updated.currentStage,
        updated.currentStep as Step,
        updated.checklistState,
        updated.quizPassed,
      ),
      quizResult: {
        score: graded.score,
        passed: graded.passed,
        results: graded.results,
      },
    });
  });

  router.post("/assignment/checklist", requireAuth, async (req, res) => {
    const { itemId, done } = req.body as { itemId?: string; done?: boolean };
    if (!itemId || typeof done !== "boolean") {
      res.status(400).json({ error: "itemId and done required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const checklistState = parseChecklistState(user.checklistState);
    checklistState[itemId] = done;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { checklistState: JSON.stringify(checklistState) },
    });

    res.json(
      buildAssignment(
        updated.trackId,
        updated.currentStage,
        updated.currentStep as Step,
        updated.checklistState,
        updated.quizPassed,
      ),
    );
  });

  router.post("/assignment/advance", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const assignment = buildAssignment(
      user.trackId,
      user.currentStage,
      user.currentStep as Step,
      user.checklistState,
      user.quizPassed,
    );

    if (!assignment?.allChecklistDone) {
      res.status(400).json({ error: "Complete the checklist first" });
      return;
    }

    const next = nextStageSlug(user.trackId, user.currentStage);
    if (!next || !getStageContent(user.trackId, next)) {
      res.status(400).json({ error: "No next stage available yet" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStage: next,
        currentStep: "lesson",
        checklistState: "{}",
        quizState: "{}",
        quizPassed: false,
      },
    });

    res.json(
      buildAssignment(
        updated.trackId,
        updated.currentStage,
        updated.currentStep as Step,
        updated.checklistState,
        updated.quizPassed,
      ),
    );
  });

  return router;
}
