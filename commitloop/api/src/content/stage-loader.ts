import fs from "node:fs";
import path from "node:path";
import { stageDir } from "./paths.js";
import {
  stageManifestSchema,
  type LoadedStage,
  type StageManifest,
} from "./schemas.js";

function readMd(filePath: string): string {
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8").trim();
}

function firstParagraph(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return lines.slice(0, 3).join(" ").slice(0, 280);
}

export function loadStageManifest(
  trackId: string,
  slug: string,
): StageManifest | null {
  const manifestPath = path.join(stageDir(trackId, slug), "stage.json");
  if (!fs.existsSync(manifestPath)) return null;

  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as unknown;
  const parsed = stageManifestSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid stage.json for ${trackId}/${slug}: ${parsed.error.message}`,
    );
  }

  if (parsed.data.slug !== slug) {
    throw new Error(
      `stage.json slug "${parsed.data.slug}" does not match folder "${slug}"`,
    );
  }

  return parsed.data;
}

export function loadStageContent(
  trackId: string,
  slug: string,
): LoadedStage | null {
  const manifest = loadStageManifest(trackId, slug);
  if (!manifest) return null;

  const dir = stageDir(trackId, slug);
  const lesson = readMd(path.join(dir, "lesson.md"));
  const sandbox = readMd(path.join(dir, "sandbox.md"));
  const project = readMd(path.join(dir, "project.md"));

  if (!lesson || !sandbox || !project) {
    return null;
  }

  return {
    ...manifest,
    lesson,
    sandbox,
    project,
    projectSummary: firstParagraph(project),
  };
}
