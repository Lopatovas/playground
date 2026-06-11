import fs from "node:fs";
import path from "node:path";
import { stageDir } from "./paths.js";
import {
  stageManifestSchema,
  type LoadedSandboxStep,
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
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("```"));
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

  const pages = manifest.lesson.pages.map((page) => ({
    id: page.id,
    title: page.title,
    body: readMd(path.join(dir, page.file)),
  }));
  if (pages.some((page) => !page.body)) return null;

  const steps: LoadedSandboxStep[] = manifest.sandbox.steps.map((step) => ({
    id: step.id,
    title: step.title,
    body: readMd(path.join(dir, step.file)),
    checkpoint: step.checkpoint,
  }));
  if (steps.some((step) => !step.body)) return null;

  let intro: string | undefined;
  if (manifest.sandbox.intro) {
    intro = readMd(path.join(dir, manifest.sandbox.intro));
    if (!intro) return null;
  }

  const project = readMd(path.join(dir, "project.md"));
  if (!project) return null;

  return {
    slug: manifest.slug,
    title: manifest.title,
    goal: manifest.goal,
    summary: manifest.summary,
    estimatedMinutes: manifest.estimatedMinutes,
    nextStage: manifest.nextStage,
    lesson: { pages },
    sandbox: { intro, steps },
    project,
    projectSummary: firstParagraph(project),
    checklist: manifest.checklist,
    quiz: manifest.quiz,
  };
}
