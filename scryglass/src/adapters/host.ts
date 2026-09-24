import type { FixturePr, PublishResult, ReviewComment, ReviewSession } from "../domain/types.js";

export type HostAdapter = {
  name: string;
  listPullRequests: () => FixturePr[];
  getPullRequest: (id: string) => FixturePr;
  readWorkdirFile: (rel: string) => string;
  publish: (session: ReviewSession, drafts: ReviewComment[]) => PublishResult;
};
