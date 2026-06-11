import fs from "node:fs";
import path from "node:path";
import { CONTENT_ROOT, stageDir, trackDir } from "./paths.js";
import { loadStageManifest } from "./stage-loader.js";
import { loadTrackManifest } from "./track-loader.js";

export type ContentValidationIssue = {
  path: string;
  message: string;
};

function checkDuplicateIds(
  ids: string[],
  manifestPath: string,
  label: string,
  issues: ContentValidationIssue[],
) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push({
        path: manifestPath,
        message: `duplicate ${label} "${id}"`,
      });
    }
    seen.add(id);
  }
}

export function validateAllContent(): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];

  if (!fs.existsSync(CONTENT_ROOT)) {
    issues.push({ path: CONTENT_ROOT, message: "content root missing" });
    return issues;
  }

  const trackIds = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name);

  for (const trackId of trackIds) {
    try {
      const track = loadTrackManifest(trackId);
      if (!track) {
        issues.push({
          path: trackDir(trackId),
          message: "missing track.json",
        });
        continue;
      }

      const slugs = new Set<string>();
      for (const stage of track.stages) {
        if (slugs.has(stage.slug)) {
          issues.push({
            path: path.join(trackDir(trackId), "track.json"),
            message: `duplicate stage slug "${stage.slug}"`,
          });
        }
        slugs.add(stage.slug);

        if (!stage.available) continue;

        const dir = stageDir(trackId, stage.slug);
        const manifestPath = path.join(dir, "stage.json");
        if (!fs.existsSync(manifestPath)) {
          issues.push({
            path: dir,
            message: "available stage missing stage.json",
          });
          continue;
        }

        try {
          const manifest = loadStageManifest(trackId, stage.slug);
          if (!manifest) continue;

          const requiredFiles = [
            "project.md",
            ...manifest.lesson.pages.map((page) => page.file),
            ...manifest.sandbox.steps.map((step) => step.file),
            ...(manifest.sandbox.intro ? [manifest.sandbox.intro] : []),
          ];

          for (const file of requiredFiles) {
            if (!fs.existsSync(path.join(dir, file))) {
              issues.push({
                path: dir,
                message: `available stage missing ${file}`,
              });
            }
          }

          checkDuplicateIds(
            manifest.lesson.pages.map((page) => page.id),
            manifestPath,
            "lesson page id",
            issues,
          );
          checkDuplicateIds(
            manifest.sandbox.steps.map((step) => step.id),
            manifestPath,
            "sandbox step id",
            issues,
          );
          checkDuplicateIds(
            manifest.checklist.map((item) => item.id),
            manifestPath,
            "checklist id",
            issues,
          );
          checkDuplicateIds(
            manifest.quiz.questions.map((question) => question.id),
            manifestPath,
            "quiz question id",
            issues,
          );
        } catch (error) {
          issues.push({
            path: dir,
            message: error instanceof Error ? error.message : "invalid stage.json",
          });
        }
      }
    } catch (error) {
      issues.push({
        path: trackDir(trackId),
        message: error instanceof Error ? error.message : "invalid track.json",
      });
    }
  }

  return issues;
}
