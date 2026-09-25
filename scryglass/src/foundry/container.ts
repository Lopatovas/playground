import { createBitbucketHost } from "../adapters/bitbucket/host.js";
import { loadBitbucketConfig } from "../adapters/bitbucket/config.js";
import { createCompositeHost } from "../adapters/composite-host.js";
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
  env?: NodeJS.ProcessEnv;
}) {
  const home = options?.home;
  const env = options?.env ?? process.env;
  const fixture = createFixtureHost({
    fixturesDir: options?.fixturesDir,
    shopRoot: options?.shopRoot,
    publishedRoot: home ? publishedDir(home) : undefined,
  });
  const bitbucketConfig = loadBitbucketConfig(env, home);
  const bitbucket = bitbucketConfig ? createBitbucketHost({ config: bitbucketConfig, home }) : null;
  const host = createCompositeHost({ fixture, bitbucket });
  const store = createFsSessionStore(home ? sessionsDir(home) : undefined);
  const reviews = createReviewService({ host, store, shopRoot: options?.shopRoot });
  const comments = createCommentService({ host, store });
  const app = createApp({
    reviews,
    comments,
    health: {
      ok: true,
      jev: false,
      hosts: {
        fixture: true,
        bitbucket: Boolean(bitbucket),
        bitbucketEdition: bitbucketConfig?.edition ?? null,
      },
    },
  });
  return { app, host, store, reviews, comments, home, bitbucketConfigured: Boolean(bitbucket) };
}
