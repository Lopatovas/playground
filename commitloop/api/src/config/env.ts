import path from "node:path";

export type AppConfig = {
  webUrl: string;
  githubClientId: string;
  githubClientSecret: string;
  githubCallbackUrl: string;
  sessionSecret: string;
  contentRoot: string;
};

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
  };
}
