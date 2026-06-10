import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { loadStageContent } from "../../content/stage-loader.js";
import { listTrackStageRefs } from "../../content/track-loader.js";
import { getTrackOverview } from "./curriculum.service.js";

export function createCurriculumRouter({
  config,
  prisma,
}: {
  config: AppConfig;
  prisma: PrismaClient;
}) {
  const router = Router();

  router.get("/tracks/:trackId/stages", async (req, res) => {
    const trackId = req.params.trackId;
    const trackDir = path.join(config.contentRoot, trackId);
    if (!fs.existsSync(trackDir)) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    let currentStage = "stage-0-onboarding";
    if (req.session.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.session.userId },
      });
      if (user) currentStage = user.currentStage;
    }

    res.json({
      trackId,
      stages: getTrackOverview(trackId, currentStage),
    });
  });

  router.get("/curriculum/:trackId", (req, res) => {
    const trackId = req.params.trackId;
    const trackDir = path.join(config.contentRoot, trackId);
    if (!fs.existsSync(trackDir)) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    const stages = listTrackStageRefs(trackId)
      .map((stageRef) => {
        const loaded = loadStageContent(trackId, stageRef.slug);
        if (!loaded) return null;

        return {
          slug: stageRef.slug,
          title: loaded.title,
          goal: loaded.goal,
          available: stageRef.available,
          lesson: loaded.lesson,
          sandbox: loaded.sandbox,
          project: loaded.project,
        };
      })
      .filter(Boolean);

    res.json({ trackId, stages });
  });

  return router;
}
