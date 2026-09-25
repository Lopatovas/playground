import { existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

import { authenticatedGitUrl, redactUrl } from "./auth.js";
import type { BitbucketConfig } from "./config.js";
import { classifyReachError } from "./network.js";

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
    exec("git", [...gitTlsArgs(options.config), ...args], {
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
    throw new Error(
      `Checkout failed (${redactUrl(authUrl)}): ${classifyReachError(error, options.config.gitHost)}`,
    );
  }
  return options.workdir;
}

export function gitTlsArgs(
  config: BitbucketConfig,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const args: string[] = [];
  if (config.caBundle) args.push("-c", `http.sslCAInfo=${config.caBundle}`);
  if (config.tlsInsecure) args.push("-c", "http.sslVerify=false");
  const proxy = env.HTTPS_PROXY ?? env.HTTP_PROXY;
  if (proxy) args.push("-c", `http.proxy=${proxy}`);
  return args;
}
