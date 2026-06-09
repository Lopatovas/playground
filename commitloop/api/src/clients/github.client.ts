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

const GITHUB_API_VERSION = "2022-11-28";
const MAX_BRANCHES = 30;
const MAX_PAGES_PER_BRANCH = 5;

function githubHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

async function githubJson<T>(
  url: string,
  token: string,
  errorLabel: string,
): Promise<T> {
  const res = await fetch(url, { headers: githubHeaders(token) });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${res.status} (${errorLabel}): ${body}`);
  }

  return res.json() as Promise<T>;
}

async function listRepoBranches(
  token: string,
  owner: string,
  repo: string,
): Promise<string[]> {
  const branches: string[] = [];
  let page = 1;

  while (page <= 3 && branches.length < MAX_BRANCHES) {
    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
    );
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const batch = await githubJson<{ name: string }[]>(
      url.toString(),
      token,
      "list branches",
    );
    if (batch.length === 0) break;

    for (const branch of batch) {
      branches.push(branch.name);
      if (branches.length >= MAX_BRANCHES) break;
    }

    if (batch.length < 100) break;
    page += 1;
  }

  return branches;
}

async function fetchBranchCommits(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  since: Date,
): Promise<GitHubCommit[]> {
  const commits: GitHubCommit[] = [];
  let page = 1;

  while (page <= MAX_PAGES_PER_BRANCH) {
    const url = new URL(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
    );
    url.searchParams.set("sha", branch);
    url.searchParams.set("since", since.toISOString());
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const batch = await githubJson<GitHubCommit[]>(
      url.toString(),
      token,
      `commits on ${branch}`,
    );
    if (batch.length === 0) break;

    commits.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return commits;
}

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
    return githubJson<GitHubUser>(
      "https://api.github.com/user",
      token,
      "user profile",
    );
  },

  async verifyRepoAccess(token, owner, repo) {
    const check = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: githubHeaders(token),
    });

    return check.ok;
  },

  async fetchRepoCommits(token, owner, repo, sinceDays = 90) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - sinceDays);

    const branches = await listRepoBranches(token, owner, repo);
    const targets = branches.length > 0 ? branches : ["HEAD"];

    const seen = new Set<string>();
    const commits: GitHubCommit[] = [];

    for (const branch of targets) {
      const batch = await fetchBranchCommits(
        token,
        owner,
        repo,
        branch,
        since,
      );

      for (const commit of batch) {
        const key =
          commit.sha ??
          `${commit.commit.author.date}:${commit.commit.message.split("\n")[0]}`;
        if (seen.has(key)) continue;
        seen.add(key);
        commits.push(commit);
      }
    }

    return commits;
  },
};
