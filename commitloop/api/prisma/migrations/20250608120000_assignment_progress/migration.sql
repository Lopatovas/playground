-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("id", "githubId", "username", "avatarUrl", "accessToken", "repoOwner", "repoName", "trackId", "currentStage", "createdAt", "updatedAt")
SELECT "id", "githubId", "username", "avatarUrl", "accessToken", "repoOwner", "repoName", "trackId", CASE WHEN "currentStage" = 'stage-0' THEN 'stage-0-onboarding' ELSE "currentStage" END, "createdAt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
