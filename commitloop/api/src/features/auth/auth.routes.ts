import type { PrismaClient } from "@prisma/client";
import { Router } from "express";
import type { GitHubClient } from "../../clients/github.client.js";
import type { AppConfig } from "../../config/env.js";

export function createAuthRouter({
  config,
  github,
  prisma,
}: {
  config: AppConfig;
  github: GitHubClient;
  prisma: PrismaClient;
}) {
  const router = Router();

  router.get("/auth/github", (req, res) => {
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

  router.get("/auth/github/callback", async (req, res) => {
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
      const token = await github.exchangeCodeForToken({
        clientId: config.githubClientId,
        clientSecret: config.githubClientSecret,
        code,
        redirectUri: config.githubCallbackUrl,
      });

      if (!token) {
        res.redirect(`${config.webUrl}/home?error=oauth_token`);
        return;
      }

      const ghUser = await github.fetchUser(token);
      const user = await prisma.user.upsert({
        where: { githubId: ghUser.id },
        create: {
          githubId: ghUser.id,
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          accessToken: token,
        },
        update: {
          username: ghUser.login,
          avatarUrl: ghUser.avatar_url,
          accessToken: token,
        },
      });

      req.session.userId = user.id;
      res.redirect(`${config.webUrl}/home`);
    } catch {
      res.redirect(`${config.webUrl}/home?error=oauth_failed`);
    }
  });

  router.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  return router;
}
