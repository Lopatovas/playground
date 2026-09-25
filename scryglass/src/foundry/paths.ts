import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function workspaceRoot(): string {
  return resolve(fileURLToPath(new URL("../../../", import.meta.url)));
}

export function fixturesRoot(): string {
  return join(workspaceRoot(), "fixtures");
}

export function loomShopRoot(): string {
  return join(fixturesRoot(), "loom-shop");
}

export function scryglassHome(override = process.env.SCRYGLASS_HOME): string {
  const home = override ?? join(homedir(), ".scryglass");
  mkdirSync(home, { recursive: true });
  return home;
}

export function sessionsDir(home = scryglassHome()): string {
  const dir = join(home, "sessions");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function publishedDir(home = scryglassHome()): string {
  const dir = join(home, "published");
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function workdirsDir(home = scryglassHome()): string {
  const dir = join(home, "workdirs");
  mkdirSync(dir, { recursive: true });
  return dir;
}
