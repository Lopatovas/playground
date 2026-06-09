import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { GitHubClient } from "../../clients/github.client.js";
import { requireAuth } from "../../middleware/auth.js";
import { computeStreak } from "./streak.service.js";

export function createStreakRouter({
  github,
  prisma,
}: {
  github: GitHubClient;
  prisma: PrismaClient;
}) {
  const router = Router();

  router.get("/streak", requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!user.repoOwner || !user.repoName) {
      res.json({
        configured: false,
        stats: null,
      });
      return;
    }

    try {
      const commits = await github.fetchRepoCommits(
        user.accessToken,
        user.repoOwner,
        user.repoName,
      );
      const stats = computeStreak(commits);

      res.json({
        configured: true,
        repo: { owner: user.repoOwner, name: user.repoName },
        stats,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : "Failed to fetch commits",
      });
    }
  });

  return router;
}
