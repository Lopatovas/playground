import { afterEach, describe, expect, it, vi } from "vitest";
import { githubClient } from "./github.client.js";

function commit(date: string, message = "work") {
  return { commit: { author: { date: `${date}T12:00:00Z` }, message } };
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

  it("paginates commits until a short page", async () => {
    const page1 = Array.from({ length: 100 }, () => commit("2025-06-01"));
    const page2 = [commit("2025-06-02")];

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
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
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws when GitHub returns a commit API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
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
