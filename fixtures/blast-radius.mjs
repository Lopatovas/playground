#!/usr/bin/env node
/**
 * Deterministic blast-radius prototype for Scryglass E02.
 * No network. No models. Same inputs → same JSON.
 *
 *   node fixtures/blast-radius.mjs
 *   node fixtures/blast-radius.mjs --pr PR-01
 *   node fixtures/blast-radius.mjs --check
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const shopRoot = join(root, "loom-shop");
const srcRoot = join(shopRoot, "src");
const prsRoot = join(root, "prs");
const expectedRoot = join(root, "expected");

const IMPORT_RE =
  /(?:import|export)\s+[\s\S]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (/\.(js|ts|mjs|cjs)$/.test(entry.name)) out.push(path);
  }
  return out;
}

function toPosix(path) {
  return path.split("\\").join("/");
}

function relSrc(abs) {
  return toPosix(relative(shopRoot, abs));
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  let base = resolve(dirname(fromFile), spec);
  if (base.endsWith(".js")) base = base.slice(0, -3);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.js`,
    join(base, "index.ts"),
    join(base, "index.js"),
  ];
  for (const candidate of candidates) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      // keep looking
    }
  }
  return null;
}

function parseImports(file) {
  const text = readFileSync(file, "utf8");
  const specs = [];
  for (const match of text.matchAll(IMPORT_RE)) {
    specs.push(match[1] || match[2]);
  }
  return specs
    .map((spec) => resolveImport(file, spec))
    .filter(Boolean)
    .map(relSrc);
}

function readShop(file) {
  return readFileSync(join(shopRoot, file), "utf8");
}

function isTestFile(file) {
  return /\.(test|spec)\./.test(file);
}

function isRouteTable(file) {
  return /path:\s*["'][^"']+["']\s*,\s*page:\s*[A-Za-z0-9_]+/.test(readShop(file));
}

function isHttpClient(file, graph) {
  const local = graph.imports[file] ?? [];
  if (local.length) return false;
  const text = readShop(file);
  return (
    /\bexport function (get|post|put|patch|del|request)\b/.test(text) ||
    /\b(fetch|axios|ky|ofetch)\b/.test(text)
  );
}

function parseRoutePairs(file) {
  const pairs = [];
  const re = /path:\s*"([^"]+)"\s*,\s*page:\s*([A-Za-z0-9_]+)/g;
  for (const match of readShop(file).matchAll(re)) {
    pairs.push({ path: match[1], page: match[2] });
  }
  return pairs;
}

function fileForExportName(name, graph) {
  const suffix = `/${name}.ts`;
  return graph.files.find((file) => file.endsWith(suffix) && !isTestFile(file));
}

function inferLayers(graph) {
  const layer = {};
  const why = {};
  const assign = (file, next, reason) => {
    if (!file || layer[file]) return;
    layer[file] = next;
    why[file] = reason;
  };

  for (const file of graph.files) {
    if (isTestFile(file)) assign(file, "test", "test filename");
  }

  for (const file of graph.files) {
    if (layer[file] || !isRouteTable(file)) continue;
    assign(file, "routes", "exports a route table { path, page }");
    for (const pair of parseRoutePairs(file)) {
      const pageFile = fileForExportName(pair.page, graph);
      assign(pageFile, "page", `registered as ${pair.path} in ${file}`);
    }
  }

  for (const file of graph.files) {
    if (layer[file]) continue;
    if ((graph.imports[file] ?? []).some((dep) => layer[dep] === "routes")) {
      assign(file, "app", "imports the route table");
    }
  }

  for (const file of graph.files) {
    if (!layer[file] && isHttpClient(file, graph)) {
      assign(file, "http", "transport: no local imports, exports get/post or uses fetch/axios");
    }
  }

  let grew = true;
  while (grew) {
    grew = false;
    for (const file of graph.files) {
      if (layer[file]) continue;
      const httpDeps = (graph.imports[file] ?? []).filter((dep) => layer[dep] === "http" || layer[dep] === "api");
      const appImporters = (graph.importedBy[file] ?? []).filter((imp) => layer[imp] !== "test");
      if (httpDeps.length && appImporters.length) {
        assign(
          file,
          "api",
          `imports ${httpDeps.join(", ")} (${httpDeps.map((dep) => layer[dep]).join("/")}) and has app importers`
        );
        grew = true;
      }
    }
  }

  for (const file of graph.files) {
    if (layer[file]) continue;
    const deps = graph.imports[file] ?? [];
    const importers = graph.importedBy[file] ?? [];
    if (deps.some((dep) => layer[dep] === "api") && importers.some((imp) => layer[imp] === "page")) {
      assign(file, "store", "imported by a page and imports an api module");
    }
  }

  for (const file of graph.files) {
    if (layer[file]) continue;
    const deps = graph.imports[file] ?? [];
    const importers = graph.importedBy[file] ?? [];
    if (
      deps.some((dep) => layer[dep] === "store" || layer[dep] === "api") &&
      importers.some((imp) => layer[imp] === "page")
    ) {
      assign(file, "composable", "imported by a page and imports store/api");
    }
  }

  grew = true;
  while (grew) {
    grew = false;
    for (const file of graph.files) {
      if (layer[file]) continue;
      const deps = graph.imports[file] ?? [];
      if (deps.some((dep) => ["http", "api", "store"].includes(layer[dep]))) continue;
      const importers = graph.importedBy[file] ?? [];
      if (importers.some((imp) => layer[imp] === "page" || layer[imp] === "component")) {
        assign(file, "component", "used by a page/component and does not import http/api/store");
        grew = true;
      }
    }
  }

  for (const file of graph.files) {
    if (layer[file]) continue;
    const importers = graph.importedBy[file] ?? [];
    if (importers.some((imp) => layer[imp] === "store" || layer[imp] === "api")) {
      assign(file, "shared", "used by a store/api module, not itself transport");
    }
  }

  for (const file of graph.files) {
    if (!layer[file]) assign(file, "other", "no spine rule matched");
  }

  return { layer, why };
}

function exportedNames(file) {
  const text = readFileSync(join(shopRoot, file), "utf8");
  return [...text.matchAll(/export function (\w+)/g)].map((match) => match[1]);
}

function colocatedTest(file, files) {
  const spec = file.replace(/\.ts$/, ".test.ts");
  return files.includes(spec) ? spec : null;
}

function lineCount(file) {
  return readFileSync(join(shopRoot, file), "utf8").split(/\r?\n/).length;
}

function buildGraph() {
  const files = walk(srcRoot).map(relSrc).sort();
  const imports = {};
  const importedBy = {};
  for (const file of files) {
    imports[file] = [];
    importedBy[file] = [];
  }
  for (const file of files) {
    const deps = [...new Set(parseImports(join(shopRoot, file)))].sort();
    imports[file] = deps;
    for (const dep of deps) {
      if (!importedBy[dep]) importedBy[dep] = [];
      importedBy[dep].push(file);
    }
  }
  for (const file of files) importedBy[file].sort();
  const graph = { files, imports, importedBy };
  const inferred = inferLayers(graph);
  graph.layer = inferred.layer;
  graph.layerWhy = inferred.why;
  return graph;
}

function collectReach(importedBy, start) {
  const direct = importedBy[start] ?? [];
  const transitive = new Set();
  const queue = [...direct];
  const seen = new Set(queue);
  while (queue.length) {
    const node = queue.shift();
    if (node !== start) transitive.add(node);
    for (const next of importedBy[node] ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return {
    direct,
    transitive: [...transitive].sort(),
  };
}

function routesFrom(graph, files) {
  const pageNames = new Set(
    files
      .filter((file) => graph.layer[file] === "page")
      .map((file) => file.split("/").pop().replace(/\.ts$/, ""))
  );
  const pairs = graph.files.filter((file) => graph.layer[file] === "routes").flatMap(parseRoutePairs);
  return [
    ...new Set(pairs.filter((pair) => pageNames.has(pair.page)).map((pair) => pair.path)),
  ].sort();
}

function pagesIn(graph, files) {
  return files.filter((file) => graph.layer[file] === "page").sort();
}

function testsIn(graph, files) {
  return files.filter((file) => graph.layer[file] === "test").sort();
}

function flag(id, severity, why) {
  return { id, severity, why: why.filter(Boolean) };
}

function flagsFor(node, graph) {
  const flags = [];
  if (node.consumerCount >= 5) {
    flags.push(flag("reach.wide", "raise", [`consumers=${node.consumerCount}`]));
  }
  if (node.routeCount >= 2) {
    flags.push(flag("reach.multi-route", "raise", [`routes=${node.routeCount}`, ...node.routes]));
  }
  if (node.routeCount >= 1) {
    const severity = ["api", "store", "http", "auth"].includes(node.layer) ? "raise" : "info";
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
    flags.push(flag("noise.isolated-page", "demote", ["one route", `consumers=${node.consumerCount}`]));
  }

  if (node.fanOut >= 4) {
    flags.push(flag("change.high-fan-out", "info", [`imports=${node.fanOut}`]));
  }

  return flags;
}

function prFlagsFor(nodes) {
  const layers = new Set(nodes.map((node) => node.layer));
  const flags = [];
  if (layers.size >= 2) {
    flags.push(flag("change.cross-layer", "raise", [...layers]));
  }
  const spine = nodes.some((node) => ["api", "store", "http", "auth"].includes(node.layer));
  const ui = nodes.some((node) => ["page", "component"].includes(node.layer));
  if (spine && ui) {
    flags.push(flag("change.spine-and-ui", "raise", ["spine file + UI file in the same PR"]));
  }
  return flags;
}

function riskFromFlags(flags) {
  const ids = new Set(flags.map((item) => item.id));
  const has = (id) => ids.has(id);
  if (
    (has("layer.http") || has("layer.api") || has("layer.auth") || has("surface.auth") || has("surface.billing")) &&
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

const RISK_ORDER = { spine: 4, high: 3, medium: 2, low: 1 };

function rankScore(node) {
  const raiseCount = node.flags.filter((item) => item.severity === "raise").length;
  return (
    RISK_ORDER[node.risk] * 20 +
    raiseCount * 3 +
    Math.min(node.consumerCount, 20) +
    node.routeCount
  );
  // line count is intentionally unused
}

function analyzePr(graph, pr) {
  const nodes = pr.changed.map((file) => {
    const reach = collectReach(graph.importedBy, file);
    const allConsumers = [...new Set([...reach.direct, ...reach.transitive])].sort();
    const node = {
      file,
      layer: graph.layer[file],
      layerWhy: graph.layerWhy[file],
      lineCount: lineCount(file),
      exports: exportedNames(file),
      fanOut: (graph.imports[file] ?? []).length,
      directConsumers: reach.direct,
      consumerCount: allConsumers.length,
      consumers: allConsumers,
      pages: pagesIn(graph, allConsumers),
      tests: testsIn(graph, [...allConsumers, file]),
      routes: routesFrom(graph, [file, ...allConsumers]),
    };
    node.routeCount = node.routes.length;
    node.flags = flagsFor(node, graph);
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

  const overallRisk = nodes.reduce(
    (max, node) => (RISK_ORDER[node.risk] > RISK_ORDER[max] ? node.risk : max),
    "low"
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

function loadPrs() {
  return readdirSync(prsRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(prsRoot, name), "utf8")));
}

function renderText(report) {
  const lines = [
    `PR ${report.id}  ${report.title}`,
    `WHAT   ${report.what}`,
    `RISK   ${report.risk}   (deterministic flags; Jev unused)`,
    `KEYS   ${report.keyPoints.join(", ")}`,
    `PR     ${(report.flags || []).map((item) => item.id).join(", ") || "—"}`,
    "",
  ];
  for (const node of report.changed) {
    lines.push(
      `${node.risk.padEnd(6)}  ${node.file}`,
      `        ${node.flags.map((item) => `${item.severity}:${item.id}`).join(" · ") || "—"}`,
      `        ${node.reasons.join(" · ")}`,
      `        routes: ${node.routes.join(", ") || "—"}`,
      `        pages:  ${node.pages.join(", ") || "—"}`,
      `        tests:  ${node.tests.join(", ") || "—"}`,
      ""
    );
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const args = { pr: null, check: false, write: false };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--pr") args.pr = argv[++i];
    else if (argv[i] === "--check") args.check = true;
    else if (argv[i] === "--write-expected") args.write = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const graph = buildGraph();
  let prs = loadPrs();
  if (args.pr) {
    prs = prs.filter((pr) => pr.id === args.pr || pr.id === `PR-${args.pr}`);
    if (!prs.length) {
      console.error(`Unknown PR ${args.pr}`);
      process.exit(1);
    }
  }

  const reports = prs.map((pr) => analyzePr(graph, pr));

  if (args.write) {
    mkdirSync(expectedRoot, { recursive: true });
    for (const report of reports) {
      writeFileSync(
        join(expectedRoot, `${report.id}.json`),
        `${JSON.stringify(report, null, 2)}\n`
      );
    }
    console.log(`Wrote ${reports.length} goldens to fixtures/expected/`);
    return;
  }

  if (args.check) {
    let failed = 0;
    for (const report of reports) {
      const path = join(expectedRoot, `${report.id}.json`);
      const expected = JSON.parse(readFileSync(path, "utf8"));
      const actual = JSON.stringify(report, null, 2);
      const want = JSON.stringify(expected, null, 2);
      if (actual !== want) {
        console.error(`DRIFT ${report.id}`);
        failed += 1;
      } else {
        console.log(`OK ${report.id} risk=${report.risk} keys=${report.keyPoints.join(",")}`);
      }
    }
    process.exit(failed ? 1 : 0);
  }

  for (const report of reports) {
    console.log(renderText(report));
    console.log("-".repeat(72));
  }
}

main();
