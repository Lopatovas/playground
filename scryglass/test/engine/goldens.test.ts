import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { createFixtureHost } from "../../src/adapters/fixture-host.js";
import { analyzeFixtureRepo } from "../../src/engine/analyze.js";
import { assertLayerInvariants } from "../../src/engine/layers.js";
import { createDiskRepoFs } from "../../src/engine/repo-fs.js";
import { fixturesRoot, loomShopRoot } from "../../src/foundry/paths.js";
import type { ImportGraph, PrReport } from "../../src/domain/types.js";

describe("engine goldens", () => {
  let graph: ImportGraph;
  let reports: PrReport[];
  const expectedRoot = join(fixturesRoot(), "expected");

  beforeAll(async () => {
    const host = createFixtureHost();
    const fs = createDiskRepoFs(loomShopRoot());
    const analyzed = analyzeFixtureRepo(fs, await host.listPullRequests());
    graph = analyzed.graph;
    reports = analyzed.reports;
  });

  it("matches every fixture/expected report byte-for-byte", () => {
    const expectedIds = readdirSync(expectedRoot)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/, ""))
      .sort();
    expect(reports.map((report) => report.id).sort()).toEqual(expectedIds);

    for (const report of reports) {
      const want = readFileSync(join(expectedRoot, `${report.id}.json`), "utf8");
      expect(`${JSON.stringify(report, null, 2)}\n`, `drift ${report.id}`).toBe(want);
    }
  });

  it("holds layer invariants including fetch-in-heading", () => {
    expect(() => assertLayerInvariants(graph)).not.toThrow();
  });

  it("ranks the shared API above a one-page heading", () => {
    const api = reports.find((report) => report.id === "PR-01");
    const heading = reports.find((report) => report.id === "PR-02");
    expect(api?.risk).toBe("spine");
    expect(api?.keyPoints[0]).toBe("src/api/customerApi.ts");
    expect(heading?.risk).toBe("low");
    expect(heading?.keyPoints[0]).toBe("src/components/SettingsHeading.ts");
  });

  it("does not promote FetchingHeading to page/http/api", () => {
    const report = reports.find((item) => item.id === "PR-07");
    const node = report?.changed[0];
    expect(report?.risk).toBe("low");
    expect(node?.layer).toBe("component");
    expect(node?.flags.some((flag) => flag.id === "ui.network")).toBe(true);
    expect(["page", "http", "api"]).not.toContain(node?.layer);
  });
});
