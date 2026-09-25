import type { PublishResult, PullRequest, ReviewComment, ReviewSession } from "../domain/types.js";

export type HostAdapter = {
  name: string;
  configured: boolean;
  listPullRequests: () => Promise<PullRequest[]>;
  openPullRequest: (input: string) => Promise<PullRequest>;
  readWorkdirFile: (rel: string, workdir?: string) => string;
  publish: (session: ReviewSession, drafts: ReviewComment[]) => Promise<PublishResult>;
};
