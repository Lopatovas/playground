import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { GitHubClient } from "../../clients/github.client.js";
import type { AppConfig } from "../../config/env.js";
import { isMentorGithubId } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";
import { buildMentorRoster } from "./mentor.service.js";

export function createMentorRouter({
  config,
  github,
  prisma,
}: {
  config: AppConfig;
  github: GitHubClient;
  prisma: PrismaClient;
}) {
  const router = Router();

  router.get("/mentor/students", requireAuth, async (req, res) => {
    const mentor = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });

    if (!mentor) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    if (!isMentorGithubId(mentor.githubId, config.mentorGithubIds)) {
      res.status(403).json({ error: "Mentor access required" });
      return;
    }

    const mentorIds = [...config.mentorGithubIds];
    const students = await prisma.user.findMany({
      where:
        mentorIds.length > 0
          ? { githubId: { notIn: mentorIds } }
          : undefined,
      orderBy: { username: "asc" },
    });

    const roster = await buildMentorRoster(students, github);
    res.json({ students: roster });
  });

  return router;
}
