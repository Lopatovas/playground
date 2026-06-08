import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import session from "express-session";
import { buildAssignment, parseChecklistState } from "./assignment.js";
import {
  getStageContent,
  getTrackOverview,
  nextStageSlug,
  type Step,
} from "./curriculum.js";
import { computeStreak, fetchRepoCommits } from "./streak.js";

export type AppConfig = {
  webUrl: string;
  githubClientId: string;
  githubClientSecret: string;
  githubCallbackUrl: string;
  sessionSecret: string;
  contentRoot: string;
};

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oauthState?: string;
  }
}

export function createApp(prisma: PrismaClient, config: AppConfig) {
  const app = express();

  app.use(
    cors({
      origin: config.webUrl,
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  function requireAuth(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    next();
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "commitloop-api" });
  });

  if (process.env.NODE_ENV === "test") {
    app.post("/test/session", (req, res) => {
      const { userId } = req.body as { userId?: string };
      if (!userId) {
        res.status(400).json({ error: "userId required" });
        return;
      }
      req.session.userId = userId;
      res.json({ ok: true });
    });
  }

  app.get("/auth/github", (req, res) => {
    if (!config.githubClientId) {
      res.status(503).json({
        error: "GitHub OAuth not configured",
        hint: "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env",
      });
      return;
    }

    const state = crypto.randomUUID();
    req.session.oauthState = state;

    const params = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: config.githubCallbackUrl,
      scope: "read:user repo",
      state,
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  });

  app.get("/auth/github/callback", async (req, res) => {
    const { code, state } = req.query;

    if (
      typeof code !== "string" ||
      typeof state !== "string" ||
      state !== req.session.oauthState
    ) {
      res.redirect(`${config.webUrl}/home?error=oauth_state`);
      return;
    }

    try {
      const tokenRes = await fetch(
        "https://github.com/login/oauth/access_token",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: config.githubClientId,
            client_secret: config.githubClientSecret,
            code,
            redirect_uri: config.githubCallbackUrl,
          }),
        },
      );

      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error?: string;
      };

      if (!tokenData.access_token) {
        res.redirect(`${config.webUrl}/home?error=oauth_token`);
        return;
      }

      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });

      const ghUser = (await userRes.json()) as {
        id: number;
        login: string;
        avatar_url: string;
      };

      const user = await prisma.user.upsert({
        where: { githubId: ghUser.id },
        create: {
          githubId: ghUser.id,
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          accessToken: tokenData.access_token,
        },
        update: {
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          accessToken: tokenData.access_token,
        },
      });

      req.session.userId = user.id;
      res.redirect(`${config.webUrl}/home`);
    } catch {
      res.redirect(`${config.webUrl}/home?error=oauth_failed`);
    }
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/me", async (req, res) => {
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

  app.get("/assignment/current", requireAuth, async (req, res) => {
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

  app.post("/assignment/step", requireAuth, async (req, res) => {
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

  app.post("/assignment/checklist", requireAuth, async (req, res) => {
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

  app.post("/assignment/advance", requireAuth, async (req, res) => {
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

  app.post("/repo", requireAuth, async (req, res) => {
    const { owner, name } = req.body as { owner?: string; name?: string };

    if (!owner?.trim() || !name?.trim()) {
      res.status(400).json({ error: "owner and name required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const check = await fetch(
      `https://api.github.com/repos/${owner}/${name}`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          Accept: "application/vnd.github+json",
        },
      },
    );

    if (!check.ok) {
      res.status(400).json({
        error: "Repository not found or not accessible with your GitHub token",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { repoOwner: owner.trim(), repoName: name.trim() },
    });

    res.json({
      repo: { owner: updated.repoOwner, name: updated.repoName },
    });
  });

  app.get("/streak", requireAuth, async (req, res) => {
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
      const commits = await fetchRepoCommits(
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

  app.get("/tracks/:trackId/stages", async (req, res) => {
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

  app.get("/curriculum/:trackId", (req, res) => {
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

  return app;
}
