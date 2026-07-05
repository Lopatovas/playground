/**
 * Capture student-facing UI screenshots into docs/UI.
 *
 * Prerequisites:
 *   docker compose up -d postgres
 *   npm install
 *
 * Run from commitloop/:
 *   npm run screenshots:capture
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "playwright";
import { PrismaClient } from "@prisma/client";
import { createApp } from "../../api/src/app.js";
import type { AppConfig } from "../../api/src/config/env.js";
import { parseMentorGithubIds } from "../../api/src/config/env.js";
import {
  screenshotContentRoot,
  screenshotGithubMock,
  SCREENSHOT_MENTOR_GITHUB_ID,
  SCREENSHOT_STUDENT_GITHUB_ID,
} from "./github-mock.js";
import {
  SCREENSHOT_MENTOR_USERNAME,
  SCREENSHOT_STUDENT_USERNAME,
} from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUTPUT_DIR = path.resolve(ROOT, "docs/UI");
const WEB_URL = "http://localhost:3000";
const API_URL = "http://localhost:3001";

const screenshotConfig: AppConfig = {
  webUrl: WEB_URL,
  githubClientId: "",
  githubClientSecret: "",
  githubCallbackUrl: `${API_URL}/auth/github/callback`,
  sessionSecret: "screenshot-secret",
  contentRoot: screenshotContentRoot,
  mentorGithubIds: parseMentorGithubIds(String(SCREENSHOT_MENTOR_GITHUB_ID)),
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(
  command: string,
  args: string[],
  env: Record<string, string>,
): ChildProcess {
  return spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: "pipe",
  });
}

async function waitForUrl(url: string, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      // retry
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function seedUsers(prisma: PrismaClient) {
  await prisma.user.deleteMany({
    where: {
      githubId: {
        in: [SCREENSHOT_MENTOR_GITHUB_ID, SCREENSHOT_STUDENT_GITHUB_ID],
      },
    },
  });

  const mentor = await prisma.user.create({
    data: {
      githubId: SCREENSHOT_MENTOR_GITHUB_ID,
      username: SCREENSHOT_MENTOR_USERNAME,
      avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
      accessToken: "screenshot-token",
      repoOwner: "mentor-ada",
      repoName: "commitloop-mentor",
    },
  });

  const student = await prisma.user.create({
    data: {
      githubId: SCREENSHOT_STUDENT_GITHUB_ID,
      username: SCREENSHOT_STUDENT_USERNAME,
      avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
      accessToken: "screenshot-token",
      repoOwner: "alex-student",
      repoName: "workout-tracker",
      currentStage: "stage-1-git",
      currentStep: "lesson",
    },
  });

  return { mentorId: mentor.id, studentId: student.id };
}

async function login(context: Awaited<ReturnType<Browser["newContext"]>>, userId: string) {
  await context.request.post(`${API_URL}/test/session`, {
    data: { userId },
  });
}

async function snap(page: Page, name: string) {
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`saved ${filePath}`);
}

async function captureAssignmentStep(
  context: Awaited<ReturnType<Browser["newContext"]>>,
  page: Page,
  studentId: string,
  step: string,
  filename: string,
) {
  await context.request.post(`${API_URL}/test/session`, {
    data: { userId: studentId },
  });
  await context.request.post(`${API_URL}/assignment/step`, {
    data: { step },
  });
  await page.goto(`${WEB_URL}/assignment`, { waitUntil: "networkidle" });
  await snap(page, filename);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL ??=
    "postgresql://commitloop:commitloop@localhost:5432/commitloop";

  const prisma = new PrismaClient();

  const { mentorId, studentId } = await seedUsers(prisma);

  const app = createApp(prisma, screenshotConfig, {
    github: screenshotGithubMock,
  });
  const apiServer = app.listen(3001);

  const web = runCommand("npm", ["run", "dev", "-w", "@commitloop/web"], {
    NEXT_PUBLIC_API_URL: API_URL,
  });

  try {
    await waitForUrl(`${API_URL}/health`);
    await waitForUrl(WEB_URL);

    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();

    await page.goto(`${WEB_URL}/`, { waitUntil: "networkidle" });
    await snap(page, "01-landing");

    await page.goto(`${WEB_URL}/curriculum`, { waitUntil: "networkidle" });
    await snap(page, "02-curriculum-public");

    await login(context, studentId);
    await page.goto(`${WEB_URL}/home`, { waitUntil: "networkidle" });
    await snap(page, "03-home-student-streak");

    await captureAssignmentStep(
      context,
      page,
      studentId,
      "lesson",
      "04-assignment-lesson",
    );
    await captureAssignmentStep(
      context,
      page,
      studentId,
      "sandbox",
      "05-assignment-sandbox",
    );
    await captureAssignmentStep(
      context,
      page,
      studentId,
      "quiz",
      "06-assignment-quiz",
    );

    await context.request.post(`${API_URL}/test/session`, {
      data: { userId: studentId },
    });
    await context.request.post(`${API_URL}/assignment/quiz`, {
      data: {
        answers: {
          "git-add": "a",
          "three-areas": "a",
          "meaningful-commit": "a",
          "what-is-branch": "a",
          "branch-purpose": "a",
        },
      },
    });
    await page.goto(`${WEB_URL}/assignment`, { waitUntil: "networkidle" });
    await snap(page, "07-assignment-project");

    await login(context, studentId);
    await page.goto(`${WEB_URL}/settings`, { waitUntil: "networkidle" });
    await snap(page, "08-settings");

    await login(context, mentorId);
    await page.goto(`${WEB_URL}/mentor`, { waitUntil: "networkidle" });
    await snap(page, "09-mentor-roster");

    await browser.close();
  } finally {
    apiServer.close();
    web.kill("SIGTERM");
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
