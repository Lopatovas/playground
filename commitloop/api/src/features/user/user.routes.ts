import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { AppConfig } from "../../config/env.js";
import { isMentorGithubId } from "../../config/env.js";

export function createUserRouter(prisma: PrismaClient, config: AppConfig) {
  const router = Router();

  router.get("/me", async (req, res) => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      repo:
        user.repoOwner && user.repoName
          ? { owner: user.repoOwner, name: user.repoName }
          : null,
      trackId: user.trackId,
      currentStage: user.currentStage,
      currentStep: user.currentStep,
      isMentor: isMentorGithubId(user.githubId, config.mentorGithubIds),
    });
  });

  return router;
}
