import type { ImportGraph, Layer } from "../domain/types.js";
import type { RepoFs } from "./repo-fs.js";
import { isTestFile } from "./files.js";

export function looksLikeTransport(fs: RepoFs, file: string): boolean {
  const text = fs.read(file);
  return (
    /\bexport function (get|post|put|patch|del|request)\b/.test(text) ||
    /\b(fetch|axios|ky|ofetch)\b/.test(text)
  );
}

export function usesNetwork(file: string, graph: ImportGraph, fs: RepoFs): boolean {
  const deps = graph.imports[file] ?? [];
  return looksLikeTransport(fs, file) || deps.some((dep) => graph.layer[dep] === "http");
}

function onlyUiImporters(file: string, graph: ImportGraph): boolean {
  const importers = (graph.importedBy[file] ?? []).filter((imp) => graph.layer[imp] !== "test");
  if (!importers.length) return false;
  return importers.every((imp) => {
    const layer = graph.layer[imp];
    return layer === "page" || layer === "component";
  });
}

function onlyKnownPageImporters(file: string, graph: ImportGraph): boolean {
  const importers = (graph.importedBy[file] ?? []).filter((imp) => graph.layer[imp] !== "test");
  return (
    importers.length > 0 &&
    importers.every((imp) => {
      const layer = graph.layer[imp];
      return layer === "page" || layer === "app" || layer === "routes";
    })
  );
}

export function parseRoutePairs(fs: RepoFs, file: string): { path: string; page: string }[] {
  const pairs: { path: string; page: string }[] = [];
  const re = /path:\s*"([^"]+)"\s*,\s*page:\s*([A-Za-z0-9_]+)/g;
  for (const match of fs.read(file).matchAll(re)) {
    const path = match[1];
    const page = match[2];
    if (path && page) pairs.push({ path, page });
  }
  return pairs;
}

function isRouteTable(fs: RepoFs, file: string): boolean {
  return /path:\s*["'][^"']+["']\s*,\s*page:\s*[A-Za-z0-9_]+/.test(fs.read(file));
}

function fileForExportName(name: string, graph: ImportGraph): string | undefined {
  const suffix = `/${name}.ts`;
  return graph.files.find((file) => file.endsWith(suffix) && !isTestFile(file));
}

export function inferLayers(
  graph: ImportGraph,
  fs: RepoFs,
): { layer: Record<string, Layer>; why: Record<string, string> } {
  const layer: Record<string, Layer> = {};
  const why: Record<string, string> = {};
  const assign = (file: string | undefined, next: Layer, reason: string): boolean => {
    if (!file || layer[file]) return false;
    layer[file] = next;
    why[file] = reason;
    return true;
  };
  const unassign = (file: string) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- demote false spine so the file can be a component
    delete layer[file];
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keep why in lockstep with layer
    delete why[file];
  };

  for (const file of graph.files) {
    if (isTestFile(file)) assign(file, "test", "test filename");
  }

  for (const file of graph.files) {
    if (layer[file] || !isRouteTable(fs, file)) continue;
    assign(file, "routes", "exports a route table { path, page }");
    for (const pair of parseRoutePairs(fs, file)) {
      assign(fileForExportName(pair.page, graph), "page", `registered as ${pair.path} in ${file}`);
    }
  }

  for (const file of graph.files) {
    if (layer[file]) continue;
    if ((graph.imports[file] ?? []).some((dep) => layer[dep] === "routes")) {
      assign(file, "app", "imports the route table");
    }
  }

  for (const file of graph.files) {
    if (layer[file] || !looksLikeTransport(fs, file)) continue;
    const importers = (graph.importedBy[file] ?? []).filter((imp) => layer[imp] !== "test");
    if (!importers.length || onlyKnownPageImporters(file, { ...graph, layer, layerWhy: why })) {
      continue;
    }
    assign(file, "http", "shared transport: used by at least one non-page module");
  }

  const withLayers = (): ImportGraph => ({ ...graph, layer, layerWhy: why });

  const growComponents = () => {
    let grew = true;
    while (grew) {
      grew = false;
      for (const file of graph.files) {
        if (layer[file]) continue;
        const importers = graph.importedBy[file] ?? [];
        if (importers.some((imp) => layer[imp] === "page" || layer[imp] === "component")) {
          grew = assign(
            file,
            "component",
            "used by a page/component (network use is ui.network, not a layer)",
          );
        }
      }
    }
  };

  let grew = true;
  while (grew) {
    grew = false;
    for (const file of graph.files) {
      if (layer[file]) continue;
      const httpDeps = (graph.imports[file] ?? []).filter(
        (dep) => layer[dep] === "http" || layer[dep] === "api",
      );
      if (!httpDeps.length) continue;
      if (onlyUiImporters(file, withLayers())) continue;
      const appImporters = (graph.importedBy[file] ?? []).filter((imp) => layer[imp] !== "test");
      if (!appImporters.length) continue;
      grew = assign(
        file,
        "api",
        `imports ${httpDeps.join(", ")} and is used outside a single page/component`,
      );
    }
  }

  for (const file of graph.files) {
    if (layer[file]) continue;
    const deps = graph.imports[file] ?? [];
    const importers = graph.importedBy[file] ?? [];
    if (
      deps.some((dep) => layer[dep] === "api") &&
      importers.some((imp) => layer[imp] === "page")
    ) {
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

  growComponents();

  let demoted = true;
  while (demoted) {
    demoted = false;
    for (const file of graph.files) {
      if (layer[file] === "http" && onlyUiImporters(file, withLayers())) {
        unassign(file);
        demoted = true;
      }
      if (layer[file] === "api") {
        const httpDeps = (graph.imports[file] ?? []).filter(
          (dep) => layer[dep] === "http" || layer[dep] === "api",
        );
        if (!httpDeps.length || onlyUiImporters(file, withLayers())) {
          unassign(file);
          demoted = true;
        }
      }
    }
  }

  growComponents();

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

export const LAYER_INVARIANTS: Record<string, Layer> = {
  "src/pages/SettingsPage.ts": "page",
  "src/components/SettingsHeading.ts": "component",
  "src/components/FetchingHeading.ts": "component",
  "src/api/httpClient.ts": "http",
  "src/api/customerApi.ts": "api",
};

export function assertLayerInvariants(graph: ImportGraph): void {
  const errors: string[] = [];
  for (const [file, want] of Object.entries(LAYER_INVARIANTS)) {
    const got = graph.layer[file];
    if (got !== want) errors.push(`${file}: layer=${got} want=${want}`);
  }
  const heading = graph.layer["src/components/FetchingHeading.ts"];
  for (const banned of ["page", "http", "api"] as const) {
    if (heading === banned) errors.push(`FetchingHeading must not be ${banned}`);
  }
  if (errors.length) {
    throw new Error(`layer invariants failed:\n${errors.join("\n")}`);
  }
}
