import { describe, expect, it } from "vitest";

import { testRuntime } from "../helpers.js";

describe("fixture host adapter", () => {
  it("exposes loom-shop sample PRs without network", () => {
    const { host } = testRuntime();
    const ids = host.listPullRequests().map((pr) => pr.id);
    expect(ids).toContain("PR-01");
    expect(ids).toContain("PR-07");
  });

  it("publish payload is PR-scoped", () => {
    const { host, reviews } = testRuntime();
    const session = reviews.open("PR-01");
    const result = host.publish(session, [
      {
        id: "c1",
        body: "look at the API",
        anchor: { kind: "general" },
        status: "draft",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        hostCommentId: null,
        publishTarget: null,
      },
    ]);
    expect(result.target).toBe("pullrequest");
    expect(result.published[0]?.publishTarget).toBe("pullrequest");
  });
});
