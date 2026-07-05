import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { GitHubClient } from "../../clients/github.client.js";
import { GITHUB_REPO_NAME_PATTERN } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";

export function createRepoRouter({
  github,
  prisma,
}: {
  github: GitHubClient;
  prisma: PrismaClient;
}) {
  const router = Router();

  router.post("/repo", requireAuth, async (req, res) => {
    const { owner, name } = req.body as { owner?: string; name?: string };

    if (!owner?.trim() || !name?.trim()) {
      res.status(400).json({ error: "owner and name required" });
      return;
    }

    const trimmedOwner = owner.trim();
    const trimmedName = name.trim();

    if (
      !GITHUB_REPO_NAME_PATTERN.test(trimmedOwner) ||
      !GITHUB_REPO_NAME_PATTERN.test(trimmedName)
    ) {
      res.status(400).json({ error: "Invalid repository owner or name" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const hasAccess = await github.verifyRepoAccess(
      user.accessToken,
      trimmedOwner,
      trimmedName,
    );

    if (!hasAccess) {
      res.status(400).json({
        error: "Repository not found or not accessible with your GitHub token",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { repoOwner: trimmedOwner, repoName: trimmedName },
    });

    res.json({
      repo: { owner: updated.repoOwner, name: updated.repoName },
    });
  });

  return router;
}
