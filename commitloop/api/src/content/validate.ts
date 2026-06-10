import fs from "node:fs";
import path from "node:path";
import { CONTENT_ROOT, stageDir, trackDir } from "./paths.js";
import { loadStageManifest } from "./stage-loader.js";
import { loadTrackManifest } from "./track-loader.js";

export type ContentValidationIssue = {
  path: string;
  message: string;
};

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
        for (const file of ["stage.json", "lesson.md", "sandbox.md", "project.md"]) {
          if (!fs.existsSync(path.join(dir, file))) {
            issues.push({
              path: dir,
              message: `available stage missing ${file}`,
            });
          }
        }

        try {
          const manifest = loadStageManifest(trackId, stage.slug);
          if (!manifest) continue;

          const checklistIds = new Set<string>();
          for (const item of manifest.checklist) {
            if (checklistIds.has(item.id)) {
              issues.push({
                path: path.join(dir, "stage.json"),
                message: `duplicate checklist id "${item.id}"`,
              });
            }
            checklistIds.add(item.id);
          }

          const questionIds = new Set<string>();
          for (const question of manifest.quiz.questions) {
            if (questionIds.has(question.id)) {
              issues.push({
                path: path.join(dir, "stage.json"),
                message: `duplicate quiz question id "${question.id}"`,
              });
            }
            questionIds.add(question.id);
          }
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
