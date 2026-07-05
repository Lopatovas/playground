import type { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { githubClient, type GitHubClient } from "./clients/github.client.js";
import type { AppConfig } from "./config/env.js";
import { createAssignmentRouter } from "./features/assignment/assignment.routes.js";
import { createAuthRouter } from "./features/auth/auth.routes.js";
import { createCurriculumRouter } from "./features/curriculum/curriculum.routes.js";
import { createHealthRouter } from "./features/health/health.routes.js";
import { createMentorRouter } from "./features/mentor/mentor.routes.js";
import { createRepoRouter } from "./features/repo/repo.routes.js";
import { createStreakRouter } from "./features/streak/streak.routes.js";
import { createUserRouter } from "./features/user/user.routes.js";
import { errorHandler } from "./middleware/error.js";
import { createSessionMiddleware } from "./middleware/session.js";
import { createTestSessionRouter } from "./test/test-session.routes.js";

export function createApp(
  prisma: PrismaClient,
  config: AppConfig,
  dependencies: { github?: GitHubClient } = {},
) {
  const github = dependencies.github ?? githubClient;
  const app = express();

  app.use(
    cors({
      origin: config.webUrl,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(createSessionMiddleware(config.sessionSecret));

  if (process.env.NODE_ENV === "test") {
    app.use(createTestSessionRouter());
  }

  app.use(createHealthRouter());
  app.use(createAuthRouter({ config, github, prisma }));
  app.use(createUserRouter(prisma, config));
  app.use(createAssignmentRouter(prisma));
  app.use(createRepoRouter({ github, prisma }));
  app.use(createStreakRouter({ github, prisma }));
  app.use(createMentorRouter({ config, github, prisma }));
  app.use(createCurriculumRouter({ config, prisma }));
  app.use(errorHandler);

  return app;
}
