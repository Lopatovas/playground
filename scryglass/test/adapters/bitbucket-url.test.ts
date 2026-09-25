import { describe, expect, it } from "vitest";

import {
  looksLikeBitbucketUrl,
  parseBitbucketPrUrl,
} from "../../src/adapters/bitbucket/parse-url.js";

describe("Bitbucket URL parser", () => {
  it("parses Bitbucket Cloud PR URLs", () => {
    const ref = parseBitbucketPrUrl(
      "https://bitbucket.org/acme/loom-shop/pull-requests/42/overview",
    );
    expect(ref).toMatchObject({
      edition: "cloud",
      workspace: "acme",
      repo: "loom-shop",
      prId: "42",
    });
    expect(looksLikeBitbucketUrl(ref.htmlUrl)).toBe(true);
  });

  it("parses Data Center project/repos URLs", () => {
    const ref = parseBitbucketPrUrl(
      "https://bitbucket.consulting.internal/projects/FE/repos/checkout/pull-requests/9",
    );
    expect(ref).toMatchObject({
      edition: "datacenter",
      host: "bitbucket.consulting.internal",
      workspace: "FE",
      repo: "checkout",
      prId: "9",
    });
  });

  it("rejects a commit URL", () => {
    expect(() =>
      parseBitbucketPrUrl("https://bitbucket.org/acme/loom-shop/commits/abc123"),
    ).toThrow(/Not a Bitbucket pull request/);
  });
});
