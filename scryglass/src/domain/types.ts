export const RISKS = ["spine", "high", "medium", "low"] as const;
export type Risk = (typeof RISKS)[number];

export const SEVERITIES = ["raise", "info", "demote"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const LAYERS = [
  "test",
  "routes",
  "page",
  "app",
  "http",
  "api",
  "store",
  "composable",
  "component",
  "shared",
  "other",
] as const;
export type Layer = (typeof LAYERS)[number];

export type AttentionFlag = {
  id: string;
  severity: Severity;
  why: string[];
};

export type ChangedNode = {
  file: string;
  layer: Layer;
  layerWhy: string;
  lineCount: number;
  exports: string[];
  fanOut: number;
  directConsumers: string[];
  consumerCount: number;
  consumers: string[];
  pages: string[];
  tests: string[];
  routes: string[];
  routeCount: number;
  flags: AttentionFlag[];
  risk: Risk;
  reasons: string[];
};

export type PrReport = {
  id: string;
  title: string;
  what: string;
  risk: Risk;
  keyPoints: string[];
  flags: AttentionFlag[];
  changed: ChangedNode[];
  deterministic: true;
  jev: null;
};

export type PullRequest = {
  id: string;
  host: string;
  title: string;
  changed: string[];
  what: string;
  base: string;
  head: string;
  sourceBranch?: string;
  destBranch?: string;
  htmlUrl?: string;
  cloneUrl?: string;
  workdir?: string;
  workspace?: string;
  repo?: string;
};

export type FixturePr = PullRequest;

export type ImportGraph = {
  files: string[];
  imports: Record<string, string[]>;
  importedBy: Record<string, string[]>;
  layer: Record<string, Layer>;
  layerWhy: Record<string, string>;
};

export type CommentAnchor =
  { kind: "general" } | { kind: "inline"; file: string; line: number; symbolId?: string };

export type ReviewComment = {
  id: string;
  body: string;
  anchor: CommentAnchor;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  hostCommentId: string | null;
  publishTarget: "pullrequest" | null;
};

export type Sitting = {
  at: string;
  changedFiles: string[];
  publishedCount: number;
};

export type ReviewSession = {
  id: string;
  host: string;
  prId: string;
  title: string;
  what: string;
  base: string;
  head: string;
  htmlUrl: string | null;
  workdir: string;
  openedAt: string;
  updatedAt: string;
  lastSittingAt: string | null;
  sittings: Sitting[];
  report: PrReport;
  comments: ReviewComment[];
  published: ReviewComment[];
};

export type PublishResult = {
  target: "pullrequest" | "commit";
  published: ReviewComment[];
  skipped: { id: string; reason: string }[];
};
