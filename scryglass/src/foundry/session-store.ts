import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { ReviewSession } from "../domain/types.js";
import { sessionsDir } from "./paths.js";

export type SessionStore = {
  get: (id: string) => ReviewSession | null;
  list: () => ReviewSession[];
  save: (session: ReviewSession) => ReviewSession;
};

export function sessionId(host: string, prId: string): string {
  return `${host}-${prId}`;
}

export function createFsSessionStore(root = sessionsDir()): SessionStore {
  const pathFor = (id: string) => join(root, `${id}.json`);

  return {
    get(id) {
      const path = pathFor(id);
      if (!existsSync(path)) return null;
      return JSON.parse(readFileSync(path, "utf8")) as ReviewSession;
    },
    list() {
      return readdirSync(root)
        .filter((name) => name.endsWith(".json"))
        .sort()
        .map((name) => JSON.parse(readFileSync(join(root, name), "utf8")) as ReviewSession);
    },
    save(session) {
      const next = { ...session, updatedAt: new Date().toISOString() };
      writeFileSync(pathFor(session.id), `${JSON.stringify(next, null, 2)}\n`);
      return next;
    },
  };
}
