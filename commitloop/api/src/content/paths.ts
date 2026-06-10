import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));

export const CONTENT_ROOT = path.resolve(DIR, "../../../content");

export function trackDir(trackId: string): string {
  return path.join(CONTENT_ROOT, trackId);
}

export function stageDir(trackId: string, slug: string): string {
  return path.join(trackDir(trackId), slug);
}
