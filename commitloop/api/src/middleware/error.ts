import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  void next;

  if (res.headersSent) {
    return;
  }

  res.status(500).json({
    error: err instanceof Error ? err.message : "Internal server error",
  });
};
