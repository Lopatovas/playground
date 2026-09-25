import type { AttentionFlag, ChangedNode, Risk, Severity } from "../domain/types.js";
import type { ImportGraph } from "../domain/types.js";
import type { RepoFs } from "./repo-fs.js";
import { usesNetwork } from "./layers.js";

export function flag(id: string, severity: Severity, why: (string | undefined)[]): AttentionFlag {
  return { id, severity, why: why.filter((item): item is string => Boolean(item)) };
}

export function colocatedTest(file: string, files: string[]): string | null {
  const spec = file.replace(/\.ts$/, ".test.ts");
  return files.includes(spec) ? spec : null;
}

export function flagsFor(node: ChangedNode, graph: ImportGraph, fs: RepoFs): AttentionFlag[] {
  const flags: AttentionFlag[] = [];
  if (node.consumerCount >= 5) {
    flags.push(flag("reach.wide", "raise", [`consumers=${node.consumerCount}`]));
  }
  if (node.routeCount >= 2) {
    flags.push(flag("reach.multi-route", "raise", [`routes=${node.routeCount}`, ...node.routes]));
  }
  if (node.routeCount >= 1) {
    const severity: Severity = ["api", "store", "http", "auth"].includes(node.layer)
      ? "raise"
      : "info";
    flags.push(flag("reach.user-facing", severity, node.routes));
  }

  if (node.layer === "http") flags.push(flag("layer.http", "raise", [node.layerWhy]));
  if (node.layer === "api") flags.push(flag("layer.api", "raise", [node.layerWhy]));
  if (node.layer === "store") flags.push(flag("layer.store", "raise", [node.layerWhy]));
  if (node.layer === "shared") flags.push(flag("layer.shared", "raise", [node.layerWhy]));
  if (["api", "store", "http", "shared"].includes(node.layer)) {
    flags.push(flag("layer.data-flow", "raise", [node.layer]));
  }
  if (node.layer === "component" && node.routeCount <= 1) {
    flags.push(flag("layer.ui-leaf", "info", ["single-route component"]));
  }
  if (node.layer === "routes") flags.push(flag("layer.routes", "raise", ["router"]));
  if ((node.layer === "page" || node.layer === "component") && usesNetwork(node.file, graph, fs)) {
    flags.push(
      flag("ui.network", "raise", ["UI talks to the network", `layer stays ${node.layer}`]),
    );
  }

  if (["api", "store", "http", "shared"].includes(node.layer) && node.exports.length) {
    flags.push(flag("contract.exports", "raise", node.exports));
  }

  const spec = colocatedTest(node.file, graph.files);
  if (spec || node.tests.length) {
    flags.push(flag("test.present", "info", spec ? [spec, ...node.tests] : node.tests));
  } else if (["api", "store", "http", "auth", "page"].includes(node.layer)) {
    flags.push(flag("test.gap", "raise", ["no colocated spec", "no test in consumer cone"]));
  }

  if (/auth|session|token|permission/.test(node.file)) {
    flags.push(flag("surface.auth", "raise", [node.file]));
  }
  if (/billing|payment|invoice|payout/.test(node.file)) {
    flags.push(flag("surface.billing", "raise", [node.file]));
  }

  if (node.layer === "page" && node.routeCount <= 1 && node.consumerCount <= 3) {
    flags.push(
      flag("noise.isolated-page", "demote", ["one route", `consumers=${node.consumerCount}`]),
    );
  }

  if (node.fanOut >= 4) {
    flags.push(flag("change.high-fan-out", "info", [`imports=${node.fanOut}`]));
  }

  return flags;
}

export function prFlagsFor(nodes: ChangedNode[]): AttentionFlag[] {
  const layers = new Set(nodes.map((node) => node.layer));
  const flags: AttentionFlag[] = [];
  if (layers.size >= 2) {
    flags.push(flag("change.cross-layer", "raise", [...layers]));
  }
  const spine = nodes.some((node) => ["api", "store", "http", "auth"].includes(node.layer));
  const ui = nodes.some((node) => node.layer === "page" || node.layer === "component");
  if (spine && ui) {
    flags.push(flag("change.spine-and-ui", "raise", ["spine file + UI file in the same PR"]));
  }
  return flags;
}

export function riskFromFlags(flags: AttentionFlag[]): Risk {
  const ids = new Set(flags.map((item) => item.id));
  const has = (id: string) => ids.has(id);
  if (
    (has("layer.http") ||
      has("layer.api") ||
      has("layer.auth") ||
      has("surface.auth") ||
      has("surface.billing")) &&
    (has("reach.wide") || has("reach.multi-route"))
  ) {
    return "spine";
  }
  if (
    has("layer.data-flow") ||
    has("contract.export-removed") ||
    has("contract.export-signature") ||
    (has("test.gap") && has("layer.api"))
  ) {
    return "high";
  }
  if (has("reach.wide") || has("change.spine-and-ui")) return "medium";
  if (has("noise.isolated-page") || has("layer.ui-leaf")) return "low";
  return "low";
}

export const RISK_ORDER: Record<Risk, number> = { spine: 4, high: 3, medium: 2, low: 1 };

export function rankScore(node: ChangedNode): number {
  const raiseCount = node.flags.filter((item) => item.severity === "raise").length;
  return (
    RISK_ORDER[node.risk] * 20 + raiseCount * 3 + Math.min(node.consumerCount, 20) + node.routeCount
  );
}

export function pagesIn(graph: ImportGraph, files: string[]): string[] {
  return files.filter((file) => graph.layer[file] === "page").sort();
}

export function testsIn(graph: ImportGraph, files: string[]): string[] {
  return files.filter((file) => graph.layer[file] === "test").sort();
}
