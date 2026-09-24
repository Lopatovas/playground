import { dirname, join, resolve } from "node:path";

import type { ImportGraph, Layer } from "../domain/types.js";
import { inferLayers } from "./layers.js";
import type { RepoFs } from "./repo-fs.js";

const IMPORT_RE =
  /(?:import|export)\s+[\s\S]*?from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function resolveImport(fs: RepoFs, fromFile: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  let base = resolve(dirname(join(fs.root, fromFile)), spec);
  if (base.endsWith(".js")) base = base.slice(0, -3);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.js`,
    join(base, "index.ts"),
    join(base, "index.js"),
  ];
  for (const candidate of candidates) {
    const rel = candidate.startsWith(fs.root)
      ? candidate
          .slice(fs.root.length + 1)
          .split("\\")
          .join("/")
      : null;
    if (rel && fs.exists(rel)) return rel;
  }
  return null;
}

function parseImports(fs: RepoFs, file: string): string[] {
  const text = fs.read(file);
  const specs: string[] = [];
  for (const match of text.matchAll(IMPORT_RE)) {
    const spec = match[1] ?? match[2];
    if (spec) specs.push(spec);
  }
  return [
    ...new Set(specs.map((spec) => resolveImport(fs, file, spec)).filter((x) => x !== null)),
  ].sort();
}

export function buildGraph(fs: RepoFs, srcDir = "src"): ImportGraph {
  const files = fs.walk(srcDir);
  const imports: Record<string, string[]> = {};
  const importedBy: Record<string, string[]> = {};
  for (const file of files) {
    imports[file] = [];
    importedBy[file] = [];
  }
  for (const file of files) {
    const deps = parseImports(fs, file);
    imports[file] = deps;
    for (const dep of deps) {
      importedBy[dep] ??= [];
      importedBy[dep].push(file);
    }
  }
  for (const file of files) {
    importedBy[file]?.sort();
  }
  const graph: ImportGraph = {
    files,
    imports,
    importedBy,
    layer: {},
    layerWhy: {},
  };
  const inferred = inferLayers(graph, fs);
  graph.layer = inferred.layer;
  graph.layerWhy = inferred.why;
  return graph;
}

export function collectReach(
  importedBy: Record<string, string[]>,
  start: string,
): { direct: string[]; transitive: string[] } {
  const direct = importedBy[start] ?? [];
  const transitive = new Set<string>();
  const queue = [...direct];
  const seen = new Set(queue);
  while (queue.length) {
    const node = queue.shift();
    if (node === undefined) break;
    if (node !== start) transitive.add(node);
    for (const next of importedBy[node] ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return { direct, transitive: [...transitive].sort() };
}

export function layerOf(graph: ImportGraph, file: string): Layer | undefined {
  return graph.layer[file];
}
