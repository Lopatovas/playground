import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

export type RepoFs = {
  root: string;
  read(rel: string): string;
  exists(rel: string): boolean;
  walk(relDir: string): string[];
};

function toPosix(path: string): string {
  return path.split("\\").join("/");
}

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".git",
  ".scryglass",
  ".next",
  ".turbo",
  "out",
]);

export function createDiskRepoFs(root: string): RepoFs {
  return {
    root,
    read(rel) {
      return readFileSync(join(root, rel), "utf8");
    },
    exists(rel) {
      return existsSync(join(root, rel));
    },
    walk(relDir) {
      const abs = join(root, relDir);
      if (!existsSync(abs)) return [];
      const out: string[] = [];
      const visit = (dir: string) => {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          const path = join(dir, entry.name);
          if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) visit(path);
          } else if (/\.(js|ts|tsx|jsx|mjs|cjs)$/.test(entry.name)) {
            out.push(toPosix(relative(root, path)));
          }
        }
      };
      visit(abs);
      return out.sort();
    },
  };
}
