import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { scryglassHome } from "../../foundry/paths.js";
import type { BitbucketEdition } from "./parse-url.js";

export type BitbucketConfig = {
  edition: BitbucketEdition;
  apiBase: string;
  gitHost: string;
  username?: string;
  password?: string;
  token?: string;
  caBundle?: string;
  tlsInsecure: boolean;
};

type FileConfig = {
  bitbucket?: {
    url?: string;
    username?: string;
    appPassword?: string;
    token?: string;
    caBundle?: string;
    tlsInsecure?: boolean;
  };
};

export function loadBitbucketConfig(
  env: NodeJS.ProcessEnv = process.env,
  home = scryglassHome(),
): BitbucketConfig | null {
  const file = readFileConfig(join(home, "config.json"));
  const username = env.BITBUCKET_USERNAME ?? file?.username;
  const password = env.BITBUCKET_APP_PASSWORD ?? file?.appPassword;
  const token = env.BITBUCKET_TOKEN ?? file?.token;
  const rawUrl = env.BITBUCKET_URL ?? file?.url ?? "https://bitbucket.org";
  if (!token && !(username && password)) return null;

  const host = hostOf(rawUrl);
  const edition: BitbucketEdition =
    env.BITBUCKET_EDITION === "datacenter" ||
    (host !== "bitbucket.org" && host !== "api.bitbucket.org")
      ? "datacenter"
      : "cloud";

  return {
    edition,
    apiBase:
      env.BITBUCKET_API_BASE ??
      (edition === "cloud" ? "https://api.bitbucket.org/2.0" : stripSlash(rawUrl)),
    gitHost: host === "api.bitbucket.org" ? "bitbucket.org" : host,
    username,
    password,
    token,
    caBundle: env.BITBUCKET_CA_BUNDLE ?? file?.caBundle ?? env.NODE_EXTRA_CA_CERTS,
    tlsInsecure: env.BITBUCKET_TLS_INSECURE === "1" || file?.tlsInsecure === true,
  };
}

export function describeBitbucketAuth(config: BitbucketConfig): string {
  if (config.token) return "token";
  if (config.username) return `basic:${config.username}`;
  return "none";
}

function readFileConfig(path: string): FileConfig["bitbucket"] {
  if (!existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as FileConfig;
    return parsed.bitbucket;
  } catch {
    return undefined;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).host;
  } catch {
    return "bitbucket.org";
  }
}

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}
