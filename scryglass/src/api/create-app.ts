import express from "express";
import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

import type { CommentService } from "../services/comment-service.js";
import type { ReviewService } from "../services/review-service.js";
import { HttpError } from "../foundry/http-error.js";

const openSessionSchema = z
  .object({
    prId: z.string().min(1).optional(),
    url: z.string().min(1).optional(),
  })
  .refine((body) => Boolean(body.prId ?? body.url), { message: "prId or url is required" });

const draftSchema = z.object({
  body: z.string(),
  file: z.string().optional(),
  line: z.number().int().positive().optional(),
  symbolId: z.string().optional(),
});

const updateDraftSchema = z.object({
  body: z.string(),
});

const publishSchema = z.object({
  ids: z.array(z.string()).optional(),
});

export type AppHealth = {
  ok: true;
  jev: false;
  hosts: {
    fixture: boolean;
    bitbucket: boolean;
    bitbucketEdition: "cloud" | "datacenter" | null;
    reachable: boolean | null;
    hint: string | null;
  };
};

export type AppServices = {
  reviews: ReviewService;
  comments: CommentService;
  health?: AppHealth | (() => Promise<AppHealth>);
};

export function createApp(services: AppServices): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", async (_req, res, next) => {
    try {
      const fallback: AppHealth = {
        ok: true,
        jev: false,
        hosts: {
          fixture: true,
          bitbucket: false,
          bitbucketEdition: null,
          reachable: null,
          hint: null,
        },
      };
      const value =
        typeof services.health === "function"
          ? await services.health()
          : (services.health ?? fallback);
      res.json(value);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/prs", async (_req, res, next) => {
    try {
      res.json({ prs: await services.reviews.listPullRequests() });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sessions", (_req, res) => {
    res.json({ sessions: services.reviews.listSessions() });
  });

  app.post("/api/sessions", async (req, res, next) => {
    try {
      const body = openSessionSchema.parse(req.body);
      const input = body.prId ?? body.url;
      if (!input) throw new HttpError(400, "prId or url is required");
      res.status(201).json({ session: await services.reviews.open(input) });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sessions/:id", (req, res) => {
    res.json({ session: services.reviews.getSession(req.params.id) });
  });

  app.get("/api/sessions/:id/file", (req, res) => {
    const path = typeof req.query.path === "string" ? req.query.path : "";
    if (!path) throw new HttpError(400, "path is required");
    res.json(services.reviews.readFile(req.params.id, path));
  });

  app.post("/api/sessions/:id/sittings", (req, res) => {
    res.status(201).json({ session: services.reviews.closeSitting(req.params.id) });
  });

  app.post("/api/sessions/:id/comments", (req, res) => {
    const body = draftSchema.parse(req.body);
    const session = services.comments.addDraft(req.params.id, {
      body: body.body,
      anchor: body.file
        ? { kind: "inline", file: body.file, line: body.line ?? 1, symbolId: body.symbolId }
        : { kind: "general" },
    });
    res.status(201).json({ session });
  });

  app.patch("/api/sessions/:id/comments/:commentId", (req, res) => {
    const body = updateDraftSchema.parse(req.body);
    res.json({
      session: services.comments.updateDraft(req.params.id, req.params.commentId, body.body),
    });
  });

  app.delete("/api/sessions/:id/comments/:commentId", (req, res) => {
    res.json({
      session: services.comments.deleteDraft(req.params.id, req.params.commentId),
    });
  });

  app.post("/api/sessions/:id/publish", async (req, res, next) => {
    try {
      const body = publishSchema.parse(req.body);
      res.json({ session: await services.comments.publish(req.params.id, body.ids) });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "validation_failed", details: error.issues });
      return;
    }
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "internal_error";
    if (message.startsWith("Unknown PR")) {
      res.status(404).json({ error: message });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "internal_error" });
  });

  return app;
}
