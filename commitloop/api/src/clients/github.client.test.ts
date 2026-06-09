import { afterEach, describe, expect, it, vi } from "vitest";
import { githubClient } from "./github.client.js";

function commit(date: string, message = "work", sha?: string) {
  return {
    sha: sha ?? `sha-${date}-${message}`,
    commit: { author: { date: `${date}T12:00:00Z` }, message },
  };
}

describe("githubClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exchanges OAuth codes for tokens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ access_token: "token" }),
      }),
    );

    await expect(
      githubClient.exchangeCodeForToken({
        clientId: "client-id",
        clientSecret: "client-secret",
        code: "code",
        redirectUri: "http://localhost/callback",
      }),
    ).resolves.toBe("token");
  });

  it("verifies repository access", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    );

    await expect(
      githubClient.verifyRepoAccess("token", "owner", "repo"),
    ).resolves.toBe(true);
  });

  it("aggregates commits across branches and deduplicates by sha", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ name: "main" }, { name: "feature/auth" }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [commit("2025-06-01", "on main", "abc123")],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            commit("2025-06-02", "feature only", "def456"),
            commit("2025-06-01", "merged duplicate", "abc123"),
          ],
        }),
    );

    const commits = await githubClient.fetchRepoCommits(
      "token",
      "owner",
      "repo",
    );

    expect(commits).toHaveLength(2);
    expect(commits.map((c) => c.sha)).toEqual(["abc123", "def456"]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("paginates commits on a branch until a short page", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) =>
      commit("2025-06-01", `work-${i}`),
    );
    const page2 = [commit("2025-06-02")];

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ name: "main" }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => page2,
        }),
    );

    const commits = await githubClient.fetchRepoCommits(
      "token",
      "owner",
      "repo",
    );
    expect(commits).toHaveLength(101);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws when GitHub returns a commit API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ name: "main" }],
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => "forbidden",
        }),
    );

    await expect(
      githubClient.fetchRepoCommits("token", "owner", "repo"),
    ).rejects.toThrow("GitHub API 403");
  });
});
