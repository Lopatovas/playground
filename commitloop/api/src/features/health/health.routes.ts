import { Router } from "express";

export function createHealthRouter() {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "commitloop-api" });
  });

  return router;
}
