import { existsSync, readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";

import type { BitbucketHttp } from "./client.js";
import type { BitbucketConfig } from "./config.js";

export function classifyReachError(error: unknown, host: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error instanceof Error && "code" in error ? String((error as { code?: string }).code) : "";
  const blob = `${code} ${message}`.toLowerCase();

  if (
    message.startsWith("Can't resolve ") ||
    message.startsWith("Can't reach ") ||
    message.startsWith("TLS failed ") ||
    message.startsWith("CA bundle not found")
  ) {
    return message;
  }

  if (blob.includes("ca bundle not found")) {
    return message;
  }

  if (
    blob.includes("enotfound") ||
    blob.includes("eai_again") ||
    blob.includes("could not resolve host")
  ) {
    return `Can't resolve ${host}. If Bitbucket is on a VPN, connect to the VPN and retry.`;
  }
  if (
    blob.includes("econnrefused") ||
    blob.includes("ehostunreach") ||
    blob.includes("enetunreach") ||
    blob.includes("etimedout") ||
    blob.includes("econnreset") ||
    blob.includes("failed to connect") ||
    blob.includes("connection timed out")
  ) {
    return `Can't reach ${host}. Scryglass is local — it does not jump the VPN for you. Connect, then retry.`;
  }
  if (
    blob.includes("cert") ||
    blob.includes("unable_to_verify") ||
    blob.includes("self signed") ||
    blob.includes("ssl certificate problem") ||
    blob.includes("unable to get local issuer")
  ) {
    return `TLS failed talking to ${host}. Point BITBUCKET_CA_BUNDLE (or NODE_EXTRA_CA_CERTS) at your corporate CA pem. Last resort: BITBUCKET_TLS_INSECURE=1.`;
  }
  return `Bitbucket request failed (${host}): ${message}`;
}

export function createBitbucketHttp(config: BitbucketConfig): BitbucketHttp {
  const rejectUnauthorized = !config.tlsInsecure;

  return async (url, init) => {
    if (config.caBundle && !existsSync(config.caBundle)) {
      throw new Error(
        `CA bundle not found at ${config.caBundle}. Set BITBUCKET_CA_BUNDLE to a readable pem.`,
      );
    }
    const ca = config.caBundle ? readFileSync(config.caBundle) : undefined;
    return nodeRequest(url, init, { ca, rejectUnauthorized });
  };
}

export async function probeBitbucket(
  config: BitbucketConfig,
  http: BitbucketHttp = createBitbucketHttp(config),
): Promise<{ reachable: boolean; hint: string | null }> {
  const url =
    config.edition === "cloud"
      ? `${config.apiBase}/user`
      : `${config.apiBase}/rest/api/1.0/application-properties`;
  try {
    const response = await http(url);
    if (response.status === 401 || response.status === 403) {
      return {
        reachable: true,
        hint: `Reached ${config.gitHost}. Check token scopes if a PR fails to open.`,
      };
    }
    if (response.ok) {
      return {
        reachable: true,
        hint: config.tlsInsecure ? "TLS verification is off (BITBUCKET_TLS_INSECURE)." : null,
      };
    }
    return { reachable: false, hint: `${config.gitHost} answered HTTP ${response.status}` };
  } catch (error) {
    return { reachable: false, hint: classifyReachError(error, config.gitHost) };
  }
}

function nodeRequest(
  url: string,
  init: RequestInit | undefined,
  tls: { ca?: Buffer; rejectUnauthorized: boolean },
): Promise<Response> {
  const target = new URL(url);
  const lib = target.protocol === "https:" ? https : http;
  const headers = new Headers(init?.headers);
  const rawHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    rawHeaders[key] = value;
  });

  const options: https.RequestOptions = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || undefined,
    path: `${target.pathname}${target.search}`,
    method: init?.method ?? "GET",
    headers: rawHeaders,
    ca: tls.ca,
    rejectUnauthorized: tls.rejectUnauthorized,
  };

  return new Promise((resolve, reject) => {
    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        resolve(
          new Response(Buffer.concat(chunks), {
            status: res.statusCode ?? 500,
          }),
        );
      });
    });
    req.setTimeout(15_000, () => {
      req.destroy(Object.assign(new Error("connection timed out"), { code: "ETIMEDOUT" }));
    });
    req.on("error", reject);
    if (typeof init?.body === "string") req.write(init.body);
    req.end();
  });
}
