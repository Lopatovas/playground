import type { ChangedNode, FixturePr, ImportGraph, PrReport } from "../domain/types.js";
import {
  flagsFor,
  pagesIn,
  prFlagsFor,
  rankScore,
  RISK_ORDER,
  riskFromFlags,
  testsIn,
} from "./flags.js";
import { fileBasename } from "./files.js";
import { buildGraph, collectReach } from "./graph.js";
import { parseRoutePairs } from "./layers.js";
import type { RepoFs } from "./repo-fs.js";

function exportedNames(fs: RepoFs, file: string): string[] {
  return [...fs.read(file).matchAll(/export function (\w+)/g)]
    .map((match) => match[1] ?? "")
    .filter(Boolean);
}

function lineCount(fs: RepoFs, file: string): number {
  return fs.read(file).split(/\r?\n/).length;
}

function routesFrom(fs: RepoFs, graph: ImportGraph, files: string[]): string[] {
  const pageNames = new Set(
    files
      .filter((file) => graph.layer[file] === "page")
      .map((file) => fileBasename(file).replace(/\.ts$/, "")),
  );
  const pairs = graph.files
    .filter((file) => graph.layer[file] === "routes")
    .flatMap((file) => parseRoutePairs(fs, file));
  return [
    ...new Set(pairs.filter((pair) => pageNames.has(pair.page)).map((pair) => pair.path)),
  ].sort();
}

export function analyzePr(fs: RepoFs, graph: ImportGraph, pr: FixturePr): PrReport {
  const nodes: ChangedNode[] = pr.changed
    .filter((file) => fs.exists(file))
    .map((file) => {
      const reach = collectReach(graph.importedBy, file);
      const allConsumers = [...new Set([...reach.direct, ...reach.transitive])].sort();
      const layer = graph.layer[file] ?? "other";
      const node: ChangedNode = {
        file,
        layer,
        layerWhy: graph.layerWhy[file] ?? "not on the JS/TS import spine",
        lineCount: lineCount(fs, file),
        exports: exportedNames(fs, file),
        fanOut: (graph.imports[file] ?? []).length,
        directConsumers: reach.direct,
        consumerCount: allConsumers.length,
        consumers: allConsumers,
        pages: pagesIn(graph, allConsumers),
        tests: testsIn(graph, [...allConsumers, file]),
        routes: routesFrom(fs, graph, [file, ...allConsumers]),
        routeCount: 0,
        flags: [],
        risk: "low",
        reasons: [],
      };
      node.routeCount = node.routes.length;
      node.flags = flagsFor(node, graph, fs);
      node.risk = riskFromFlags(node.flags);
      node.reasons = [
        `layer=${node.layer} (${node.layerWhy})`,
        `consumers=${node.consumerCount}`,
        `routes=${node.routeCount}`,
        `flags=${node.flags.map((item) => item.id).join(",") || "—"}`,
        `lines=${node.lineCount} (fact, not used for risk)`,
      ];
      return node;
    });

  const flags = prFlagsFor(nodes);
  for (const node of nodes) {
    if (flags.some((item) => item.id === "change.spine-and-ui")) {
      node.flags = [...node.flags, ...flags.filter((item) => item.id === "change.spine-and-ui")];
      node.risk = riskFromFlags(node.flags);
    }
  }

  nodes.sort((a, b) => rankScore(b) - rankScore(a) || a.file.localeCompare(b.file));

  const overallRisk = nodes.reduce<ChangedNode["risk"]>(
    (max, node) => (RISK_ORDER[node.risk] > RISK_ORDER[max] ? node.risk : max),
    "low",
  );

  return {
    id: pr.id,
    title: pr.title,
    what: pr.what,
    risk: overallRisk,
    keyPoints: nodes.slice(0, 3).map((node) => node.file),
    flags,
    changed: nodes,
    deterministic: true,
    jev: null,
  };
}

export function analyzeFixtureRepo(
  fs: RepoFs,
  prs: FixturePr[],
): { graph: ImportGraph; reports: PrReport[] } {
  const graph = buildGraph(fs);
  return { graph, reports: prs.map((pr) => analyzePr(fs, graph, pr)) };
}
