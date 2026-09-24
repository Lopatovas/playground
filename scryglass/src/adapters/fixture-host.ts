import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { HostAdapter } from "./host.js";
import type { FixturePr, PublishResult, ReviewComment, ReviewSession } from "../domain/types.js";
import { fixturesRoot, loomShopRoot, publishedDir } from "../foundry/paths.js";

function loadPrs(prsRoot: string): FixturePr[] {
  return readdirSync(prsRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(prsRoot, name), "utf8")) as FixturePr);
}

export function createFixtureHost(options?: {
  fixturesDir?: string;
  shopRoot?: string;
  publishedRoot?: string;
}): HostAdapter {
  const prsRoot = join(options?.fixturesDir ?? fixturesRoot(), "prs");
  const shopRoot = options?.shopRoot ?? loomShopRoot();
  const outRoot = options?.publishedRoot ?? publishedDir();
  const prs = loadPrs(prsRoot);

  return {
    name: "fixture",
    listPullRequests() {
      return prs;
    },
    getPullRequest(id) {
      const found = prs.find((pr) => pr.id === id || pr.id === `PR-${id}`);
      if (!found) {
        throw new Error(`Unknown PR ${id}`);
      }
      return found;
    },
    readWorkdirFile(rel) {
      return readFileSync(join(shopRoot, rel), "utf8");
    },
    publish(session: ReviewSession, drafts: ReviewComment[]): PublishResult {
      const published = drafts.map((draft, index) => ({
        ...draft,
        status: "published" as const,
        updatedAt: new Date().toISOString(),
        hostCommentId: `fixture-${session.prId}-${String(index + 1)}`,
        publishTarget: "pullrequest" as const,
      }));
      const payload = {
        target: "pullrequest" as const,
        host: "fixture",
        prId: session.prId,
        comments: published.map((comment) => ({
          id: comment.hostCommentId,
          body: comment.body,
          anchor: comment.anchor,
          destination: "pullrequest",
        })),
      };
      writeFileSync(join(outRoot, `${session.prId}.json`), `${JSON.stringify(payload, null, 2)}\n`);
      return { target: "pullrequest", published, skipped: [] };
    },
  };
}
