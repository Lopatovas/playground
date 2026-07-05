import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GitHubClient, GitHubCommit } from "../../api/src/clients/github.client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function mockCommitsForStreak(days = 21): GitHubCommit[] {
  const commits: GitHubCommit[] = [];
  const today = new Date();

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    commits.push({
      sha: `mock-sha-${offset}`,
      commit: {
        author: { date: date.toISOString() },
        message: `feat: daily progress — day ${days - offset}`,
      },
    });
  }

  return commits;
}

export const screenshotGithubMock: GitHubClient = {
  async exchangeCodeForToken() {
    return "mock-token";
  },

  async fetchUser() {
    return {
      id: 900002,
      login: "alex-student",
      avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
    };
  },

  async verifyRepoAccess() {
    return true;
  },

  async fetchRepoCommits() {
    return mockCommitsForStreak();
  },
};

export const SCREENSHOT_MENTOR_GITHUB_ID = 900_001;
export const SCREENSHOT_STUDENT_GITHUB_ID = 900_002;

export const screenshotContentRoot = path.resolve(
  __dirname,
  "../../content",
);
