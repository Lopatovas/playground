import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import {
  getStageContent,
  nextStageSlug,
  type Step,
} from "../curriculum/curriculum.service.js";
import { buildAssignment, parseChecklistState } from "./assignment.service.js";

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
    );

    if (!assignment) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }

    res.json(assignment);
  });

  router.post("/assignment/step", requireAuth, async (req, res) => {
    const { step } = req.body as { step?: Step };
    if (!step || !["lesson", "sandbox", "project"].includes(step)) {
      res.status(400).json({ error: "Invalid step" });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.session.userId! },
      data: { currentStep: step },
    });

    res.json(
      buildAssignment(
        user.trackId,
        user.currentStage,
        user.currentStep as Step,
        user.checklistState,
      ),
    );
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

    const state = parseChecklistState(user.checklistState);
    state[itemId] = done;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { checklistState: JSON.stringify(state) },
    });

    res.json(
      buildAssignment(
        updated.trackId,
        updated.currentStage,
        updated.currentStep as Step,
        updated.checklistState,
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
    );

    if (!assignment?.allChecklistDone) {
      res.status(400).json({ error: "Complete the checklist first" });
      return;
    }

    const next = nextStageSlug(user.currentStage);
    if (!next || !getStageContent(next)) {
      res.status(400).json({ error: "No next stage available yet" });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStage: next,
        currentStep: "lesson",
        checklistState: "{}",
      },
    });

    res.json(
      buildAssignment(
        updated.trackId,
        updated.currentStage,
        updated.currentStep as Step,
        updated.checklistState,
      ),
    );
  });

  return router;
}
