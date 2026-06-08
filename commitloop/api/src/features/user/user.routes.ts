import type { PrismaClient } from "@prisma/client";
import { Router } from "express";

export function createUserRouter(prisma: PrismaClient) {
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
    });
  });

  return router;
}
