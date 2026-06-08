-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "accessToken" TEXT NOT NULL,
    "repoOwner" TEXT,
    "repoName" TEXT,
    "trackId" TEXT NOT NULL DEFAULT 'track-1',
    "currentStage" TEXT NOT NULL DEFAULT 'stage-0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
