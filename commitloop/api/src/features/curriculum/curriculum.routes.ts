import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
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
    if (req.params.trackId !== "track-1") {
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
      trackId: "track-1",
      stages: getTrackOverview("track-1", currentStage),
    });
  });

  router.get("/curriculum/:trackId", (req, res) => {
    const trackDir = path.join(config.contentRoot, req.params.trackId);
    if (!fs.existsSync(trackDir)) {
      res.status(404).json({ error: "Track not found" });
      return;
    }

    const stages = fs
      .readdirSync(trackDir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .map((filename) => {
        const slug = filename.replace(/\.md$/, "");
        const content = fs.readFileSync(path.join(trackDir, filename), "utf-8");
        const titleMatch = content.match(/^#\s+(.+)$/m);
        return {
          slug,
          title: titleMatch?.[1] ?? slug,
          content,
        };
      });

    res.json({ trackId: req.params.trackId, stages });
  });

  return router;
}
