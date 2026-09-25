import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

import { authenticatedGitUrl, redactUrl } from "./auth.js";
import type { BitbucketConfig } from "./config.js";

export type ExecFile = typeof execFileSync;

export function checkoutPullRequest(options: {
  workdir: string;
  cloneUrl: string;
  ref: string;
  altRefs?: string[];
  config: BitbucketConfig;
  exec?: ExecFile;
}): string {
  const exec = options.exec ?? execFileSync;
  const authUrl = authenticatedGitUrl(options.cloneUrl, options.config);
  mkdirSync(options.workdir, { recursive: true });

  const git = (args: string[]) => {
    exec("git", args, {
      cwd: options.workdir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  };

  try {
    if (!existsSync(`${options.workdir}/.git`)) {
      git(["init", "--quiet"]);
      git(["remote", "add", "origin", authUrl]);
    } else {
      git(["remote", "set-url", "origin", authUrl]);
    }
    const refs = [options.ref, ...(options.altRefs ?? [])].filter(Boolean);
    let fetched = false;
    let lastError: unknown;
    for (const ref of refs) {
      try {
        git(["fetch", "--force", "--update-head-ok", "origin", ref]);
        fetched = true;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!fetched) {
      throw lastError instanceof Error ? lastError : new Error("git fetch failed");
    }
    git(["checkout", "--force", "FETCH_HEAD"]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "git failed";
    throw new Error(`Checkout failed (${redactUrl(authUrl)}): ${redactUrl(message)}`);
  }
  return options.workdir;
}
