import { existsSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import { join } from "node:path";

import express from "express";

import { createRuntime } from "./foundry/container.js";
import { workspaceRoot } from "./foundry/paths.js";

const port = Number(process.env.PORT ?? 8787);
const { app } = createRuntime();

async function attachSeat(): Promise<void> {
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    const vite = await import("vite");
    const server = await vite.createServer({
      configFile: join(workspaceRoot(), "scryglass/vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(server.middlewares);
    return;
  }
  const seat = join(workspaceRoot(), "scryglass/dist/seat");
  if (!existsSync(seat)) {
    console.warn("Seat build missing. Run npm run build.");
    return;
  }
  app.use(express.static(seat));
  app.get(/.*/, (_req, res) => {
    res.sendFile(join(seat, "index.html"));
  });
}

await attachSeat();

const server = createHttpServer(app);
server.listen(port, () => {
  console.info(`Scryglass High Seat on http://127.0.0.1:${String(port)}`);
});
