import type { GitHubCommit } from "../features/streak/streak.service.js";

export type GitHubClient = {
  exchangeCodeForToken: (params: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
  }) => Promise<string | null>;
  fetchUser: (token: string) => Promise<GitHubUser>;
  verifyRepoAccess: (
    token: string,
    owner: string,
    repo: string,
  ) => Promise<boolean>;
  fetchRepoCommits: (
    token: string,
    owner: string,
    repo: string,
    sinceDays?: number,
  ) => Promise<GitHubCommit[]>;
};

export type GitHubUser = {
  id: number;
  login: string;
  avatar_url: string;
};

export const githubClient: GitHubClient = {
  async exchangeCodeForToken({ clientId, clientSecret, code, redirectUri }) {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      },
    );

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    return tokenData.access_token ?? null;
  },

  async fetchUser(token) {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    return (await userRes.json()) as GitHubUser;
  },

  async verifyRepoAccess(token, owner, repo) {
    const check = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });

    return check.ok;
  },

  async fetchRepoCommits(token, owner, repo, sinceDays = 90) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - sinceDays);

    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
    );
    url.searchParams.set("since", since.toISOString());
    url.searchParams.set("per_page", "100");

    const commits: GitHubCommit[] = [];
    let page = 1;

    while (page <= 5) {
      url.searchParams.set("page", String(page));
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`GitHub API ${res.status}: ${body}`);
      }

      const batch = (await res.json()) as GitHubCommit[];
      if (batch.length === 0) break;
      commits.push(...batch);
      if (batch.length < 100) break;
      page += 1;
    }

    return commits;
  },
};
