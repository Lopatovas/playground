import type { HostAdapter } from "../adapters/host.js";
import type { ReviewSession } from "../domain/types.js";
import { analyzePr } from "../engine/analyze.js";
import { buildGraph, detectGraphRoots } from "../engine/graph.js";
import { assertLayerInvariants } from "../engine/layers.js";
import { createDiskRepoFs } from "../engine/repo-fs.js";
import { loomShopRoot } from "../foundry/paths.js";
import { badRequest, notFound } from "../foundry/http-error.js";
import type { SessionStore } from "../foundry/session-store.js";
import { sessionId } from "../foundry/session-store.js";

export type ReviewService = {
  listPullRequests: () => ReturnType<HostAdapter["listPullRequests"]>;
  listSessions: () => ReviewSession[];
  getSession: (id: string) => ReviewSession;
  open: (input: string) => Promise<ReviewSession>;
  readFile: (sessionIdValue: string, rel: string) => { path: string; text: string };
  closeSitting: (id: string) => ReviewSession;
};

export function createReviewService(deps: {
  host: HostAdapter;
  store: SessionStore;
  shopRoot?: string;
}): ReviewService {
  const shopRoot = deps.shopRoot ?? loomShopRoot();

  const requireSession = (id: string): ReviewSession => {
    const session = deps.store.get(id);
    if (!session) throw notFound(`Session ${id} not found`);
    return session;
  };

  return {
    listPullRequests() {
      return deps.host.listPullRequests();
    },
    listSessions() {
      return deps.store.list();
    },
    getSession(id) {
      return requireSession(id);
    },
    async open(input) {
      if (!input.trim()) throw badRequest("prId or Bitbucket URL is required");
      const pr = await deps.host.openPullRequest(input.trim());
      const workdir = pr.workdir ?? shopRoot;
      const key = pr.workspace && pr.repo ? `${pr.workspace}-${pr.repo}-${pr.id}` : pr.id;
      const id = sessionId(pr.host, key);
      const existing = deps.store.get(id);
      const fs = createDiskRepoFs(workdir);
      const graph = buildGraph(fs, pr.host === "fixture" ? ["src"] : detectGraphRoots(fs));
      if (pr.host === "fixture") assertLayerInvariants(graph);
      const report = analyzePr(fs, graph, pr);
      const now = new Date().toISOString();
      if (existing) {
        return deps.store.save({
          ...existing,
          title: pr.title,
          what: pr.what,
          base: pr.base,
          head: pr.head,
          htmlUrl: pr.htmlUrl ?? existing.htmlUrl,
          workdir,
          report,
          updatedAt: now,
        });
      }
      return deps.store.save({
        id,
        host: pr.host,
        prId: pr.id,
        title: pr.title,
        what: pr.what,
        base: pr.base,
        head: pr.head,
        htmlUrl: pr.htmlUrl ?? null,
        workdir,
        openedAt: now,
        updatedAt: now,
        lastSittingAt: null,
        sittings: [],
        report,
        comments: [],
        published: [],
      });
    },
    readFile(sessionIdValue, rel) {
      const session = requireSession(sessionIdValue);
      if (rel.includes("..")) throw badRequest("Invalid path");
      return { path: rel, text: deps.host.readWorkdirFile(rel, session.workdir || shopRoot) };
    },
    closeSitting(id) {
      const session = requireSession(id);
      const sitting = {
        at: new Date().toISOString(),
        changedFiles: session.report.changed.map((node) => node.file),
        publishedCount: session.published.length,
      };
      return deps.store.save({
        ...session,
        lastSittingAt: sitting.at,
        sittings: [...session.sittings, sitting],
      });
    },
  };
}
