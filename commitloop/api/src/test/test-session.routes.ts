import { Router } from "express";

export function createTestSessionRouter() {
  const router = Router();

  router.post("/test/session", (req, res) => {
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }

    req.session.userId = userId;
    res.json({ ok: true });
  });

  return router;
}
