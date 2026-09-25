import type { BitbucketConfig } from "./config.js";

export function bitbucketHeaders(config: BitbucketConfig): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (config.token) {
    headers.authorization = `Bearer ${config.token}`;
    return headers;
  }
  if (config.username && config.password) {
    headers.authorization = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
    return headers;
  }
  throw new Error("Bitbucket credentials missing");
}

export function authenticatedGitUrl(cloneUrl: string, config: BitbucketConfig): string {
  const url = new URL(cloneUrl);
  if (config.token) {
    url.username = "x-token-auth";
    url.password = config.token;
    return url.toString();
  }
  if (config.username && config.password) {
    url.username = config.username;
    url.password = config.password;
    return url.toString();
  }
  return cloneUrl;
}

export function redactUrl(url: string): string {
  return url.replace(/\/\/([^/@]+):([^@]+)@/g, "//***:***@");
}
