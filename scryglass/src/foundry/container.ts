import { createFixtureHost } from "../adapters/fixture-host.js";
import { createApp } from "../api/create-app.js";
import { createCommentService } from "../services/comment-service.js";
import { createReviewService } from "../services/review-service.js";
import { publishedDir, sessionsDir } from "./paths.js";
import { createFsSessionStore } from "./session-store.js";

export function createRuntime(options?: {
  home?: string;
  shopRoot?: string;
  fixturesDir?: string;
}) {
  const home = options?.home;
  const host = createFixtureHost({
    fixturesDir: options?.fixturesDir,
    shopRoot: options?.shopRoot,
    publishedRoot: home ? publishedDir(home) : undefined,
  });
  const store = createFsSessionStore(home ? sessionsDir(home) : undefined);
  const reviews = createReviewService({ host, store, shopRoot: options?.shopRoot });
  const comments = createCommentService({ host, store });
  const app = createApp({ reviews, comments });
  return { app, host, store, reviews, comments, home };
}
