import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import type { Express } from "express";
import request from "supertest";
import { createApp } from "../app.js";
import type { AppConfig } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const testConfig: AppConfig = {
  webUrl: "http://localhost:3000",
  githubClientId: "",
  githubClientSecret: "",
  githubCallbackUrl: "http://localhost:3001/auth/github/callback",
  sessionSecret: "test-secret",
  contentRoot: path.resolve(__dirname, "../../../content"),
};

export function createTestPrisma() {
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
}

export function createTestApp(prisma: PrismaClient): Express {
  return createApp(prisma, testConfig);
}

export async function seedUser(
  prisma: PrismaClient,
  overrides?: {
    currentStage?: string;
    currentStep?: string;
    checklistState?: string;
    quizPassed?: boolean;
  },
) {
  return prisma.user.create({
    data: {
      githubId: Math.floor(Math.random() * 1_000_000_000),
      username: "test-user",
      accessToken: "test-token",
      currentStage: overrides?.currentStage ?? "stage-0-onboarding",
      currentStep: overrides?.currentStep ?? "lesson",
      checklistState: overrides?.checklistState ?? "{}",
      quizPassed: overrides?.quizPassed ?? false,
    },
  });
}

export async function loginAgent(app: Express, userId: string) {
  const agent = request.agent(app);
  await agent.post("/test/session").send({ userId }).expect(200);
  return agent;
}
