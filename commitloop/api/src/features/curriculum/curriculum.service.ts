import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CONTENT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../content",
);

export type Step = "lesson" | "sandbox" | "project";

export type StageMeta = {
  slug: string;
  title: string;
  available: boolean;
};

export const TRACK_1_STAGES: StageMeta[] = [
  {
    slug: "stage-0-onboarding",
    title: "Stage 0 — Onboarding",
    available: true,
  },
  {
    slug: "stage-1-git-fundamentals",
    title: "Stage 1 — Git Fundamentals",
    available: true,
  },
  {
    slug: "stage-2-end-to-end",
    title: "Stage 2 — First End-to-End System",
    available: false,
  },
  {
    slug: "stage-3-structure",
    title: "Stage 3 — System Structure",
    available: false,
  },
  {
    slug: "stage-4-deployment",
    title: "Stage 4 — Deployment",
    available: false,
  },
  { slug: "stage-5-testing", title: "Stage 5 — Testing", available: false },
  {
    slug: "stage-6-expansion",
    title: "Stage 6 — Expansion Loop",
    available: false,
  },
];

function readStageFile(slug: string): string | null {
  const file = path.join(CONTENT_ROOT, "track-1", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf-8");
}

function section(md: string, heading: string): string {
  const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  return re.exec(md)?.[1]?.trim() ?? "";
}

function firstParagraph(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return lines.slice(0, 3).join(" ").slice(0, 280);
}

function parseChecklist(
  md: string,
  stageSlug: string,
): { id: string; label: string }[] {
  const block = section(md, "Checklist");
  if (!block) return [];

  return block
    .split("\n")
    .map((line) => line.match(/^- \[ \] (.+)$/))
    .filter(Boolean)
    .map((m, i) => ({
      id: `${stageSlug}:${i}`,
      label: m![1]!,
    }));
}

export function getStageContent(slug: string) {
  const md = readStageFile(slug);
  if (!md) return null;

  const title = md.match(/^#\s+(.+)$/m)?.[1] ?? slug;
  const goal = md.match(/\*\*Goal:\*\*\s*(.+)/)?.[1] ?? "";

  return {
    slug,
    title,
    goal,
    lesson: section(md, "Lesson"),
    sandbox: section(md, "Sandbox Task"),
    project: section(md, "Project Implementation"),
    checklist: parseChecklist(md, slug),
    projectSummary: firstParagraph(section(md, "Project Implementation")),
  };
}

export function getTrackOverview(trackId: string, currentStage: string) {
  if (trackId !== "track-1") return [];

  const currentIdx = TRACK_1_STAGES.findIndex((s) => s.slug === currentStage);

  return TRACK_1_STAGES.map((stage, i) => {
    let status: "complete" | "current" | "locked" = "locked";
    if (!stage.available) {
      status = "locked";
    } else if (stage.slug === currentStage) {
      status = "current";
    } else if (currentIdx >= 0 && i < currentIdx) {
      status = "complete";
    }

    return { ...stage, status };
  });
}

export function nextStageSlug(current: string): string | null {
  const idx = TRACK_1_STAGES.findIndex((s) => s.slug === current);
  if (idx < 0) return null;
  const next = TRACK_1_STAGES[idx + 1];
  return next?.available ? next.slug : null;
}

export function stepLabel(step: Step): string {
  const labels: Record<Step, string> = {
    lesson: "Lesson",
    sandbox: "Sandbox Task",
    project: "Project Implementation",
  };
  return labels[step];
}
