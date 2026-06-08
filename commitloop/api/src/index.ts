import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../.env",
  ),
});
import fs from "node:fs";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import session from "express-session";
import { PrismaClient } from "@prisma/client";
import { computeStreak, fetchRepoCommits } from "./streak.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const PORT = Number(process.env.API_PORT ?? 3001);
const WEB_URL = process.env.WEB_URL ?? "http://localhost:5173";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";
const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ??
  `http://localhost:${PORT}/auth/github/callback`;
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev-only-change-me";
const CONTENT_ROOT = path.resolve(__dirname, "../../content");

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oauthState?: string;
  }
}

const app = express();

app.use(
  cors({
    origin: WEB_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(
  session({
    secret: SESSION_SECRET,
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

app.get("/auth/github", (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    res.status(503).json({
      error: "GitHub OAuth not configured",
      hint: "Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env",
    });
    return;
  }

  const state = crypto.randomUUID();
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_CALLBACK_URL,
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
    res.redirect(`${WEB_URL}/dashboard?error=oauth_state`);
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
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      },
    );

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (!tokenData.access_token) {
      res.redirect(`${WEB_URL}/dashboard?error=oauth_token`);
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
    res.redirect(`${WEB_URL}/dashboard`);
  } catch {
    res.redirect(`${WEB_URL}/dashboard?error=oauth_failed`);
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
  });
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

app.get("/curriculum/:trackId", (req, res) => {
  const trackDir = path.join(CONTENT_ROOT, req.params.trackId);
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

app.listen(PORT, () => {
  console.log(`CommitLoop API → http://localhost:${PORT}`);
});
