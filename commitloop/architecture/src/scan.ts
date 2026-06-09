import fs from "node:fs";
import path from "node:path";
import { COMMITLOOP_ROOT } from "./paths.js";

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".next",
  "coverage",
  "prisma",
]);

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,$]+\s+from\s+)?['"]([^'"]+)['"]/g;

export function absPath(relativePath: string): string {
  return path.join(COMMITLOOP_ROOT, relativePath);
}

export function readText(relativePath: string): string {
  return fs.readFileSync(absPath(relativePath), "utf8");
}

export function pathExists(relativePath: string): boolean {
  return fs.existsSync(absPath(relativePath));
}

export function listChildDirs(relativeDir: string): string[] {
  const abs = absPath(relativeDir);
  if (!fs.existsSync(abs)) return [];

  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function walkDir(
  relativeDir: string,
  options: { extensions?: string[] } = {},
): string[] {
  const abs = absPath(relativeDir);
  if (!fs.existsSync(abs)) return [];

  const extensions = options.extensions;
  const results: string[] = [];

  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(relativeDir, entry.name).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...walkDir(rel, options));
      continue;
    }

    if (extensions && !extensions.some((ext) => rel.endsWith(ext))) {
      continue;
    }

    results.push(rel);
  }

  return results.sort();
}

export function parseImportSpecifiers(source: string): string[] {
  const specs: string[] = [];

  for (const match of source.matchAll(IMPORT_RE)) {
    specs.push(match[1]);
  }

  return specs;
}

function resolveRelativeImport(fromFile: string, specifier: string): string {
  const fromDir = path.dirname(fromFile);
  const joined = path.normalize(path.join(fromDir, specifier)).replaceAll("\\", "/");

  const candidates = [
    joined,
    `${joined}.ts`,
    `${joined}.tsx`,
    `${joined}.js`,
    path.join(joined, "index.ts").replaceAll("\\", "/"),
    path.join(joined, "index.tsx").replaceAll("\\", "/"),
  ];

  for (const candidate of candidates) {
    if (pathExists(candidate)) return candidate;
  }

  return joined;
}

export function resolveImport(
  fromFile: string,
  specifier: string,
): string | null {
  if (specifier.startsWith("@/")) {
    return `web/${specifier.slice(2)}`;
  }

  if (specifier.startsWith(".")) {
    return resolveRelativeImport(fromFile, specifier);
  }

  return null;
}

export function resolveImports(fromFile: string): string[] {
  const source = readText(fromFile);
  const specifiers = parseImportSpecifiers(source);

  return specifiers
    .map((specifier) => resolveImport(fromFile, specifier))
    .filter((resolved): resolved is string => resolved !== null);
}

export function usesApiClient(relativePath: string): boolean {
  const source = readText(relativePath);
  return /\bapi\.[a-zA-Z]/.test(source) || /\bapiRequest\s*\(/.test(source);
}

export function featureFromApiPath(relativePath: string): string | null {
  const match = relativePath.match(/^api\/src\/features\/([^/]+)\//);
  return match?.[1] ?? null;
}

export function featureFromWebPath(relativePath: string): string | null {
  const match = relativePath.match(/^web\/features\/([^/]+)\//);
  return match?.[1] ?? null;
}

export function isApiServiceFile(relativePath: string): boolean {
  return /^api\/src\/features\/[^/]+\/[^/]+\.service\.ts$/.test(relativePath);
}

export function isApiRoutesFile(relativePath: string): boolean {
  return /^api\/src\/features\/[^/]+\/[^/]+\.routes\.ts$/.test(relativePath);
}

export function isWebPageFile(relativePath: string): boolean {
  return /^web\/app\/(?:.+\/)?page\.tsx$/.test(relativePath);
}

export function formatViolation(file: string, message: string): string {
  return `${file}: ${message}`;
}
