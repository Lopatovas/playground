import type { HostAdapter } from "./host.js";
import type { PublishResult, ReviewComment, ReviewSession } from "../domain/types.js";
import { HttpError } from "../foundry/http-error.js";
import { looksLikeBitbucketUrl } from "./bitbucket/parse-url.js";

export function createCompositeHost(options: {
  fixture: HostAdapter;
  bitbucket: HostAdapter | null;
}): HostAdapter {
  const { fixture, bitbucket } = options;

  const pick = (session: ReviewSession): HostAdapter => {
    if (session.host.startsWith("bitbucket")) {
      if (!bitbucket) throw new HttpError(400, missingBitbucketHelp());
      return bitbucket;
    }
    return fixture;
  };

  return {
    name: "composite",
    configured: true,
    async listPullRequests() {
      return fixture.listPullRequests();
    },
    async openPullRequest(input) {
      if (looksLikeBitbucketUrl(input)) {
        if (!bitbucket) throw new HttpError(400, missingBitbucketHelp());
        return bitbucket.openPullRequest(input);
      }
      return fixture.openPullRequest(input);
    },
    readWorkdirFile(rel, workdir) {
      if (workdir) return (bitbucket ?? fixture).readWorkdirFile(rel, workdir);
      return fixture.readWorkdirFile(rel, workdir);
    },
    async publish(session: ReviewSession, drafts: ReviewComment[]): Promise<PublishResult> {
      return pick(session).publish(session, drafts);
    },
  };
}

export function missingBitbucketHelp(): string {
  return [
    "Bitbucket credentials are not configured.",
    "Set BITBUCKET_TOKEN, or BITBUCKET_USERNAME + BITBUCKET_APP_PASSWORD.",
    "For Data Center also set BITBUCKET_URL=https://your-bitbucket.example",
    'Optional: ~/.scryglass/config.json { "bitbucket": { "username", "appPassword", "token", "url" } }',
  ].join(" ");
}
