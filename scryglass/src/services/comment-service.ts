import { randomUUID } from "node:crypto";

import type { HostAdapter } from "../adapters/host.js";
import type { CommentAnchor, ReviewComment, ReviewSession } from "../domain/types.js";
import { badRequest, notFound } from "../foundry/http-error.js";
import type { SessionStore } from "../foundry/session-store.js";

export type CommentService = {
  addDraft: (sessionId: string, input: { body: string; anchor: CommentAnchor }) => ReviewSession;
  updateDraft: (sessionId: string, commentId: string, body: string) => ReviewSession;
  deleteDraft: (sessionId: string, commentId: string) => ReviewSession;
  publish: (sessionId: string, ids?: string[]) => Promise<ReviewSession>;
};

export function createCommentService(deps: {
  host: HostAdapter;
  store: SessionStore;
}): CommentService {
  const requireSession = (id: string): ReviewSession => {
    const session = deps.store.get(id);
    if (!session) throw notFound(`Session ${id} not found`);
    return session;
  };

  return {
    addDraft(sessionId, input) {
      const body = input.body.trim();
      if (!body) throw badRequest("Empty drafts cannot be saved");
      if (input.anchor.kind === "inline" && input.anchor.line < 1) {
        throw badRequest("Inline comments need a 1-based line");
      }
      const now = new Date().toISOString();
      const session = requireSession(sessionId);
      const comment: ReviewComment = {
        id: randomUUID(),
        body,
        anchor: input.anchor,
        status: "draft",
        createdAt: now,
        updatedAt: now,
        hostCommentId: null,
        publishTarget: null,
      };
      return deps.store.save({ ...session, comments: [...session.comments, comment] });
    },
    updateDraft(sessionId, commentId, body) {
      const trimmed = body.trim();
      if (!trimmed) throw badRequest("Empty drafts cannot be saved");
      const session = requireSession(sessionId);
      const comments = session.comments.map((comment) => {
        if (comment.id !== commentId) return comment;
        if (comment.status !== "draft") throw badRequest("Only drafts can be edited");
        return { ...comment, body: trimmed, updatedAt: new Date().toISOString() };
      });
      if (!comments.some((comment) => comment.id === commentId)) {
        throw notFound(`Comment ${commentId} not found`);
      }
      return deps.store.save({ ...session, comments });
    },
    deleteDraft(sessionId, commentId) {
      const session = requireSession(sessionId);
      const comment = session.comments.find((item) => item.id === commentId);
      if (!comment) throw notFound(`Comment ${commentId} not found`);
      if (comment.status !== "draft") throw badRequest("Only drafts can be deleted");
      return deps.store.save({
        ...session,
        comments: session.comments.filter((item) => item.id !== commentId),
      });
    },
    async publish(sessionId, ids) {
      const session = requireSession(sessionId);
      const selected = session.comments.filter((comment) => {
        if (comment.status !== "draft") return false;
        return ids === undefined || ids.includes(comment.id);
      });
      if (!selected.length) throw badRequest("No drafts to publish");
      const result = await deps.host.publish(session, selected);
      if (result.target !== "pullrequest") {
        throw new Error("Host adapter refused PR publish target");
      }
      const publishedIds = new Set(result.published.map((comment) => comment.id));
      const remaining = session.comments.filter((comment) => !publishedIds.has(comment.id));
      return deps.store.save({
        ...session,
        comments: remaining,
        published: [...session.published, ...result.published],
      });
    },
  };
}
