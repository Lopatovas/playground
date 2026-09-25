import { describe, expect, it } from "vitest";

import { checkoutPullRequest, gitTlsArgs } from "../../src/adapters/bitbucket/checkout.js";
import { createBitbucketClient } from "../../src/adapters/bitbucket/client.js";
import { loadBitbucketConfig, type BitbucketConfig } from "../../src/adapters/bitbucket/config.js";
import { createBitbucketHost } from "../../src/adapters/bitbucket/host.js";
import { classifyReachError, probeBitbucket } from "../../src/adapters/bitbucket/network.js";
import { HttpError } from "../../src/foundry/http-error.js";
import { tempHome } from "../helpers.js";

const dcConfig: BitbucketConfig = {
  edition: "datacenter",
  apiBase: "https://bb.internal",
  gitHost: "bb.internal",
  token: "test-token",
  tlsInsecure: false,
};

describe("VPN / reach errors", () => {
  it("tells the reviewer to connect to the VPN on DNS and connect failures", () => {
    expect(
      classifyReachError(
        Object.assign(new Error("getaddrinfo"), { code: "ENOTFOUND" }),
        "bb.internal",
      ),
    ).toMatch(/VPN/);
    expect(
      classifyReachError(
        Object.assign(new Error("connect"), { code: "ECONNREFUSED" }),
        "bb.internal",
      ),
    ).toMatch(/VPN/);
    expect(
      classifyReachError(new Error("Could not resolve host: bb.internal"), "bb.internal"),
    ).toMatch(/VPN/);
    expect(
      classifyReachError(
        new Error("Can't resolve bb.internal. Already classified."),
        "bb.internal",
      ),
    ).toBe("Can't resolve bb.internal. Already classified.");
  });

  it("points at a corporate CA on TLS failures", () => {
    expect(
      classifyReachError(new Error("unable to get local issuer certificate"), "bb.internal"),
    ).toMatch(/BITBUCKET_CA_BUNDLE/);
    expect(
      classifyReachError(
        new Error("SSL certificate problem: self signed certificate"),
        "bb.internal",
      ),
    ).toMatch(/CA/);
  });
});

describe("git TLS flags", () => {
  it("passes the corporate CA and optional insecure flag to git", () => {
    expect(
      gitTlsArgs({
        edition: "datacenter",
        apiBase: "https://bb.internal",
        gitHost: "bb.internal",
        tlsInsecure: false,
        caBundle: "/tmp/corp.pem",
      }),
    ).toEqual(["-c", "http.sslCAInfo=/tmp/corp.pem"]);
    expect(
      gitTlsArgs(
        {
          edition: "datacenter",
          apiBase: "https://bb.internal",
          gitHost: "bb.internal",
          tlsInsecure: true,
        },
        { HTTPS_PROXY: "http://proxy.internal:8080" },
      ),
    ).toEqual(["-c", "http.sslVerify=false", "-c", "http.proxy=http://proxy.internal:8080"]);
  });

  it("classifies a git fetch DNS failure as a VPN miss", () => {
    expect(() =>
      checkoutPullRequest({
        workdir: tempHome(),
        cloneUrl: "https://bb.internal/scm/FE/app.git",
        ref: "abc",
        config: dcConfig,
        exec: () => {
          throw Object.assign(new Error("Could not resolve host: bb.internal"), { code: "128" });
        },
      }),
    ).toThrow(/VPN/);
  });
});

describe("Bitbucket config TLS", () => {
  it("reads BITBUCKET_CA_BUNDLE and falls back to NODE_EXTRA_CA_CERTS", () => {
    const fromBundle = loadBitbucketConfig({
      BITBUCKET_TOKEN: "t",
      BITBUCKET_URL: "https://bb.internal",
      BITBUCKET_CA_BUNDLE: "/etc/ssl/corp.pem",
    });
    expect(fromBundle?.caBundle).toBe("/etc/ssl/corp.pem");
    expect(fromBundle?.edition).toBe("datacenter");
    expect(fromBundle?.tlsInsecure).toBe(false);

    const fromNode = loadBitbucketConfig({
      BITBUCKET_TOKEN: "t",
      BITBUCKET_URL: "https://bb.internal",
      NODE_EXTRA_CA_CERTS: "/etc/ssl/node.pem",
    });
    expect(fromNode?.caBundle).toBe("/etc/ssl/node.pem");

    const insecure = loadBitbucketConfig({
      BITBUCKET_TOKEN: "t",
      BITBUCKET_TLS_INSECURE: "1",
    });
    expect(insecure?.tlsInsecure).toBe(true);
  });
});

describe("reach probe", () => {
  it("treats 401 as reachable (VPN is up, token may be wrong)", async () => {
    const probe = await probeBitbucket(dcConfig, () =>
      Promise.resolve(new Response("nope", { status: 401 })),
    );
    expect(probe.reachable).toBe(true);
    expect(probe.hint).toMatch(/Reached bb.internal/);
  });

  it("returns a VPN hint when the host cannot be resolved", async () => {
    const probe = await probeBitbucket(dcConfig, () =>
      Promise.reject(Object.assign(new Error("getaddrinfo"), { code: "ENOTFOUND" })),
    );
    expect(probe.reachable).toBe(false);
    expect(probe.hint).toMatch(/VPN/);
  });
});

describe("unreachable host", () => {
  it("client wraps DNS failure as HTTP 503 with a VPN hint", async () => {
    const client = createBitbucketClient(dcConfig, () =>
      Promise.reject(Object.assign(new Error("getaddrinfo"), { code: "ENOTFOUND" })),
    );
    await expect(
      client.fetchPullRequest({
        edition: "datacenter",
        host: "bb.internal",
        workspace: "FE",
        repo: "app",
        prId: "3",
        htmlUrl: "https://bb.internal/projects/FE/repos/app/pull-requests/3",
      }),
    ).rejects.toMatchObject({
      status: 503,
      message: expect.stringMatching(/VPN/),
    });
  });

  it("host refuses to open a PR when the probe cannot reach Bitbucket", async () => {
    const host = createBitbucketHost({
      config: dcConfig,
      home: tempHome(),
      http: () => Promise.reject(Object.assign(new Error("connect"), { code: "ECONNREFUSED" })),
    });
    await expect(
      host.openPullRequest("https://bb.internal/projects/FE/repos/app/pull-requests/3"),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      host.openPullRequest("https://bb.internal/projects/FE/repos/app/pull-requests/3"),
    ).rejects.toMatchObject({
      status: 503,
      message: expect.stringMatching(/VPN/),
    });
  });
});
