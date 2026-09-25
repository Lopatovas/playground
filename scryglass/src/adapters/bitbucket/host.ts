import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { HostAdapter } from "../host.js";
import type { PublishResult, ReviewComment, ReviewSession } from "../../domain/types.js";
import { HttpError } from "../../foundry/http-error.js";
import { workdirsDir } from "../../foundry/paths.js";
import { checkoutPullRequest, type ExecFile } from "./checkout.js";
import { commentUrl, createBitbucketClient, type BitbucketHttp, type FetchedPr } from "./client.js";
import type { BitbucketConfig } from "./config.js";
import { looksLikeBitbucketUrl, parseBitbucketPrUrl } from "./parse-url.js";

export function createBitbucketHost(options: {
  config: BitbucketConfig;
  home?: string;
  http?: BitbucketHttp;
  exec?: ExecFile;
}): HostAdapter {
  const client = createBitbucketClient(options.config, options.http);
  const roots = workdirsDir(options.home);

  return {
    name: options.config.edition === "cloud" ? "bitbucket-cloud" : "bitbucket-dc",
    configured: true,
    listPullRequests() {
      return Promise.resolve([]);
    },
    async openPullRequest(input) {
      if (!looksLikeBitbucketUrl(input)) {
        throw new HttpError(400, "Paste a Bitbucket pull request URL");
      }
      const ref = parseBitbucketPrUrl(input);
      const pr = await client.fetchPullRequest(ref);
      const workdir = join(roots, ref.host, ref.workspace, ref.repo, pr.id);
      checkoutPullRequest({
        workdir,
        cloneUrl: pr.cloneUrl ?? `https://${ref.host}/${ref.workspace}/${ref.repo}.git`,
        ref: pr.head,
        altRefs: [`refs/pull-requests/${pr.id}/from`, pr.sourceBranch].filter(
          (item): item is string => Boolean(item),
        ),
        config: options.config,
        exec: options.exec,
      });
      return { ...pr, workdir };
    },
    readWorkdirFile(rel, workdir) {
      if (!workdir) throw new Error("Bitbucket session is missing a workdir");
      return readFileSync(join(workdir, rel), "utf8");
    },
    async publish(session: ReviewSession, drafts: ReviewComment[]): Promise<PublishResult> {
      const pr = fetchedFromSession(session);
      const url = commentUrl(options.config, pr);
      if (url.includes("/commit")) {
        throw new Error("Refusing to post a commit comment");
      }
      const published: ReviewComment[] = [];
      const skipped: { id: string; reason: string }[] = [];
      for (const draft of drafts) {
        try {
          const hostCommentId = await client.postPrComment(
            pr,
            draft.body,
            draft.anchor.kind === "inline"
              ? { file: draft.anchor.file, line: draft.anchor.line }
              : undefined,
          );
          published.push({
            ...draft,
            status: "published",
            updatedAt: new Date().toISOString(),
            hostCommentId,
            publishTarget: "pullrequest",
          });
        } catch (error) {
          skipped.push({
            id: draft.id,
            reason: error instanceof Error ? error.message : "publish failed",
          });
        }
      }
      if (!published.length) {
        throw new Error(skipped[0]?.reason ?? "Nothing published to the pull request");
      }
      return { target: "pullrequest", published, skipped };
    },
  };
}

function fetchedFromSession(session: ReviewSession): FetchedPr {
  if (!session.htmlUrl) {
    throw new Error("Session is missing the Bitbucket PR URL");
  }
  const ref = parseBitbucketPrUrl(session.htmlUrl);
  return {
    id: session.prId,
    host: session.host,
    title: session.title,
    what: session.what,
    changed: session.report.changed.map((node) => node.file),
    base: session.base,
    head: session.head,
    htmlUrl: session.htmlUrl,
    workdir: session.workdir,
    edition: ref.edition,
    workspace: ref.workspace,
    repo: ref.repo,
  };
}
