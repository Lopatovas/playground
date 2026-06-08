import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const prisma = new PrismaClient();
const PORT = Number(process.env.API_PORT ?? 3001);

const app = createApp(prisma, {
  webUrl: process.env.WEB_URL ?? "http://localhost:3000",
  githubClientId: process.env.GITHUB_CLIENT_ID ?? "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  githubCallbackUrl:
    process.env.GITHUB_CALLBACK_URL ??
    `http://localhost:${PORT}/auth/github/callback`,
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
  contentRoot: path.resolve(__dirname, "../../content"),
});

app.listen(PORT, () => {
  console.log(`CommitLoop API → http://localhost:${PORT}`);
});
