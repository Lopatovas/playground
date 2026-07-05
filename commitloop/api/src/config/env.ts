import path from "node:path";

export type AppConfig = {
  webUrl: string;
  githubClientId: string;
  githubClientSecret: string;
  githubCallbackUrl: string;
  sessionSecret: string;
  contentRoot: string;
  mentorGithubIds: Set<number>;
};

export function parseMentorGithubIds(raw: string | undefined): Set<number> {
  if (!raw?.trim()) return new Set();

  return new Set(
    raw
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((id) => Number.isFinite(id) && id > 0),
  );
}

export function isMentorGithubId(
  githubId: number,
  mentorGithubIds: Set<number>,
): boolean {
  return mentorGithubIds.has(githubId);
}

export function loadAppConfig({
  apiPort,
  rootDir,
}: {
  apiPort: number;
  rootDir: string;
}): AppConfig {
  return {
    webUrl: process.env.WEB_URL ?? "http://localhost:3000",
    githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    githubCallbackUrl:
      process.env.GITHUB_CALLBACK_URL ??
      `http://localhost:${apiPort}/auth/github/callback`,
    sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
    contentRoot: path.resolve(rootDir, "../../content"),
    mentorGithubIds: parseMentorGithubIds(process.env.MENTOR_GITHUB_IDS),
  };
}

const INSECURE_SECRETS = new Set(["", "dev-only-change-me", "test-secret"]);

export function assertProductionConfig(config: AppConfig): void {
  if (process.env.NODE_ENV !== "production") return;

  if (INSECURE_SECRETS.has(config.sessionSecret)) {
    throw new Error(
      "SESSION_SECRET must be set to a strong random value in production",
    );
  }

  if (!config.githubClientId || !config.githubClientSecret) {
    throw new Error(
      "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET are required in production",
    );
  }
}

export const GITHUB_REPO_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
