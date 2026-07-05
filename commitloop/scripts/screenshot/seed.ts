/**
 * Seeds demo users for UI screenshots. Requires Postgres (docker compose up).
 * Run: npx tsx scripts/screenshot/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import {
  SCREENSHOT_MENTOR_GITHUB_ID,
  SCREENSHOT_STUDENT_GITHUB_ID,
} from "./github-mock.js";
import {
  SCREENSHOT_MENTOR_USERNAME,
  SCREENSHOT_STUDENT_USERNAME,
} from "./constants.js";

const prisma = new PrismaClient();

async function main() {
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
      currentStage: "stage-0-onboarding",
      currentStep: "lesson",
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
      trackId: "track-1",
      currentStage: "stage-1-git",
      currentStep: "lesson",
      quizPassed: false,
    },
  });

  console.log(
    JSON.stringify({
      mentorId: mentor.id,
      studentId: student.id,
    }),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
