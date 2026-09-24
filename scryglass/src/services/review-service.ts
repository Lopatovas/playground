import type { HostAdapter } from "../adapters/host.js";
import type { ReviewSession } from "../domain/types.js";
import { analyzePr } from "../engine/analyze.js";
import { buildGraph } from "../engine/graph.js";
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
  open: (prId: string) => ReviewSession;
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
    open(prId) {
      if (!prId.trim()) throw badRequest("prId is required");
      const pr = deps.host.getPullRequest(prId);
      const id = sessionId(deps.host.name, pr.id);
      const existing = deps.store.get(id);
      const fs = createDiskRepoFs(shopRoot);
      const graph = buildGraph(fs);
      assertLayerInvariants(graph);
      const report = analyzePr(fs, graph, pr);
      const now = new Date().toISOString();
      if (existing) {
        return deps.store.save({
          ...existing,
          title: pr.title,
          what: pr.what,
          report,
          updatedAt: now,
        });
      }
      return deps.store.save({
        id,
        host: deps.host.name,
        prId: pr.id,
        title: pr.title,
        what: pr.what,
        base: "fixture-base",
        head: "fixture-head",
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
      requireSession(sessionIdValue);
      if (rel.includes("..")) throw badRequest("Invalid path");
      return { path: rel, text: deps.host.readWorkdirFile(rel) };
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
