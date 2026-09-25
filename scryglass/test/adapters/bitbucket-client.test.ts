import { describe, expect, it } from "vitest";

import type { ExecFile } from "../../src/adapters/bitbucket/checkout.js";
import { commentUrl, createBitbucketClient } from "../../src/adapters/bitbucket/client.js";
import type { BitbucketConfig } from "../../src/adapters/bitbucket/config.js";
import { createBitbucketHost } from "../../src/adapters/bitbucket/host.js";
import { missingBitbucketHelp } from "../../src/adapters/composite-host.js";
import { createCompositeHost } from "../../src/adapters/composite-host.js";
import { createFixtureHost } from "../../src/adapters/fixture-host.js";
import { fixturesRoot, loomShopRoot } from "../../src/foundry/paths.js";
import { tempHome } from "../helpers.js";

const cloudConfig: BitbucketConfig = {
  edition: "cloud",
  apiBase: "https://api.bitbucket.org/2.0",
  gitHost: "bitbucket.org",
  token: "test-token",
};

describe("Bitbucket client", () => {
  it("maps a Cloud PR and posts comments to the pull request, never a commit", async () => {
    const calls: { url: string; body?: unknown }[] = [];
    const http = (url: string, init?: RequestInit) => {
      const raw = init?.body;
      const parsed = typeof raw === "string" ? (JSON.parse(raw) as unknown) : undefined;
      calls.push({ url, body: parsed });
      if (url.endsWith("/pullrequests/7")) {
        return json({
          id: 7,
          title: "Tighten search",
          description: "shared API",
          source: {
            branch: { name: "feat" },
            commit: { hash: "aaa111" },
            repository: {
              links: { clone: [{ name: "https", href: "https://bitbucket.org/acme/shop.git" }] },
            },
          },
          destination: { branch: { name: "main" }, commit: { hash: "bbb222" } },
          links: { html: { href: "https://bitbucket.org/acme/shop/pull-requests/7" } },
        });
      }
      if (url.includes("/diffstat")) {
        return json({
          values: [{ new: { path: "src/api/customerApi.ts" } }],
        });
      }
      if (url.endsWith("/comments") && init?.method === "POST") {
        return json({ id: 99 });
      }
      return json({});
    };

    const client = createBitbucketClient(cloudConfig, http);
    const pr = await client.fetchPullRequest({
      edition: "cloud",
      host: "bitbucket.org",
      workspace: "acme",
      repo: "shop",
      prId: "7",
      htmlUrl: "https://bitbucket.org/acme/shop/pull-requests/7",
    });
    expect(pr.changed).toEqual(["src/api/customerApi.ts"]);
    expect(pr.head).toBe("aaa111");

    const url = commentUrl(cloudConfig, pr);
    expect(url).toBe(
      "https://api.bitbucket.org/2.0/repositories/acme/shop/pullrequests/7/comments",
    );
    expect(url).not.toContain("/commit");

    const id = await client.postPrComment(pr, "look here", {
      file: "src/api/customerApi.ts",
      line: 3,
    });
    expect(id).toBe("99");
    const posted = calls.find((call) => call.url.endsWith("/comments"));
    expect(posted?.body).toEqual({
      content: { raw: "look here" },
      inline: { path: "src/api/customerApi.ts", to: 3 },
    });
    expect(JSON.stringify(calls.map((call) => call.url))).not.toContain("/commit/");
  });

  it("Data Center comment URL is the PR comments collection", () => {
    const url = commentUrl(
      { ...cloudConfig, edition: "datacenter", apiBase: "https://bitbucket.example" },
      {
        id: "3",
        host: "bitbucket-dc",
        title: "x",
        what: "x",
        changed: [],
        base: "a",
        head: "b",
        edition: "datacenter",
        workspace: "FE",
        repo: "app",
      },
    );
    expect(url).toBe(
      "https://bitbucket.example/rest/api/1.0/projects/FE/repos/app/pull-requests/3/comments",
    );
    expect(url).not.toContain("commit");
  });

  it("composite host refuses a Bitbucket URL when credentials are missing", async () => {
    const host = createCompositeHost({
      fixture: createFixtureHost({ fixturesDir: fixturesRoot(), shopRoot: loomShopRoot() }),
      bitbucket: null,
    });
    await expect(
      host.openPullRequest("https://bitbucket.org/acme/shop/pull-requests/1"),
    ).rejects.toThrow(missingBitbucketHelp());
  });

  it("opens a Cloud URL through the host with a stubbed git checkout", async () => {
    const home = tempHome();
    const gitArgs: string[][] = [];
    const host = createBitbucketHost({
      config: cloudConfig,
      home,
      http: (url) => {
        if (url.endsWith("/pullrequests/7")) {
          return json({
            id: 7,
            title: "Tighten search",
            source: { branch: { name: "feat" }, commit: { hash: "aaa111" } },
            destination: { branch: { name: "main" }, commit: { hash: "bbb222" } },
            links: { html: { href: "https://bitbucket.org/acme/shop/pull-requests/7" } },
          });
        }
        if (url.includes("/diffstat")) {
          return json({ values: [{ new: { path: "src/api/customerApi.ts" } }] });
        }
        return json({});
      },
      exec: ((_cmd, args) => {
        gitArgs.push(args as string[]);
        return "";
      }) as ExecFile,
    });
    const pr = await host.openPullRequest("https://bitbucket.org/acme/shop/pull-requests/7");
    expect(pr.title).toBe("Tighten search");
    expect(pr.workdir).toContain("acme");
    expect(gitArgs.some((args) => args[0] === "clone" || args[0] === "checkout")).toBe(true);
    expect(gitArgs.flat().join(" ")).not.toContain("commit comment");
  });
});

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
