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

function layerFor(file) {
  if (file.includes("/api/httpClient.")) return "http";
  if (file.includes("/api/") && file.endsWith(".test.ts")) return "test";
  if (file.includes("/api/")) return "api";
  if (file.includes("/stores/")) return "store";
  if (file.includes("/pages/") && file.endsWith(".test.ts")) return "test";
  if (file.includes("/pages/")) return "page";
  if (file.includes("/components/")) return "component";
  if (file.endsWith("routes.ts")) return "routes";
  if (file.endsWith("main.ts")) return "app";
  if (file.includes(".test.")) return "test";
  return "other";
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
  return { files, imports, importedBy };
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

function parseRouteTable() {
  const text = readFileSync(join(shopRoot, "src/routes.ts"), "utf8");
  const pairs = [];
  const re = /path:\s*"([^"]+)"\s*,\s*page:\s*([A-Za-z0-9_]+)/g;
  for (const match of text.matchAll(re)) {
    pairs.push({ path: match[1], page: match[2] });
  }
  return pairs;
}

function routesFrom(files) {
  const pairs = parseRouteTable();
  const pageNames = new Set(
    files
      .filter((file) => layerFor(file) === "page")
      .map((file) => file.split("/").pop().replace(/\.ts$/, ""))
  );
  return [
    ...new Set(pairs.filter((pair) => pageNames.has(pair.page)).map((pair) => pair.path)),
  ].sort();
}

function pagesIn(files) {
  return files.filter((file) => layerFor(file) === "page").sort();
}

function testsIn(files) {
  return files.filter((file) => layerFor(file) === "test").sort();
}

function riskFor(node) {
  const { layer, consumerCount, routeCount } = node;
  if (layer === "http" || (layer === "api" && (consumerCount >= 3 || routeCount >= 2))) {
    return "spine";
  }
  if (layer === "store" && routeCount >= 2) return "high";
  if (layer === "api") return "high";
  if (layer === "store" || (layer === "component" && consumerCount >= 4)) return "medium";
  if (layer === "page" && routeCount <= 1 && consumerCount <= 3) return "low";
  if (layer === "component" && routeCount <= 1) return "low";
  if (layer === "test") return "low";
  return consumerCount >= 6 ? "medium" : "low";
}

const RISK_ORDER = { spine: 4, high: 3, medium: 2, low: 1 };

function rankScore(node) {
  const layerBonus = { http: 20, api: 16, store: 10, routes: 4, page: 3, component: 2, app: 1, test: 0, other: 1 };
  return (
    (layerBonus[node.layer] ?? 0) +
    Math.min(node.consumerCount, 20) +
    node.routeCount * 3 +
    RISK_ORDER[node.risk] * 5
  );
  // line count is intentionally unused
}

function analyzePr(graph, pr) {
  const nodes = pr.changed.map((file) => {
    const reach = collectReach(graph.importedBy, file);
    const allConsumers = [...new Set([...reach.direct, ...reach.transitive])].sort();
    const node = {
      file,
      layer: layerFor(file),
      lineCount: lineCount(file),
      directConsumers: reach.direct,
      consumerCount: allConsumers.length,
      consumers: allConsumers,
      pages: pagesIn(allConsumers),
      tests: testsIn([...allConsumers, file]),
      routes: routesFrom([file, ...allConsumers]),
    };
    node.routeCount = node.routes.length;
    node.risk = riskFor(node);
    node.reasons = [
      `layer=${node.layer}`,
      `consumers=${node.consumerCount}`,
      `routes=${node.routeCount}`,
      `lines=${node.lineCount} (fact, not used for risk)`,
    ];
    return node;
  });

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
    `RISK   ${report.risk}   (deterministic; Jev unused)`,
    `KEYS   ${report.keyPoints.join(", ")}`,
    "",
  ];
  for (const node of report.changed) {
    lines.push(
      `${node.risk.padEnd(6)}  ${node.file}`,
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
