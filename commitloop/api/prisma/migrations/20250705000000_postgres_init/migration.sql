-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "repoOwner" TEXT,
    "repoName" TEXT,
    "trackId" TEXT NOT NULL DEFAULT 'track-1',
    "currentStage" TEXT NOT NULL DEFAULT 'stage-0-onboarding',
    "currentStep" TEXT NOT NULL DEFAULT 'lesson',
    "checklistState" TEXT NOT NULL DEFAULT '{}',
    "quizState" TEXT NOT NULL DEFAULT '{}',
    "quizPassed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
