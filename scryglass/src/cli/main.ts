#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { analyzeFixtureRepo } from "../engine/analyze.js";
import { assertLayerInvariants } from "../engine/layers.js";
import { createDiskRepoFs } from "../engine/repo-fs.js";
import { createFixtureHost } from "../adapters/fixture-host.js";
import { fixturesRoot, loomShopRoot } from "../foundry/paths.js";

function help(): string {
  return [
    "scryglass — local review cockpit",
    "",
    "  scryglass open [PR-01]   print the deterministic report (then run npm run dev)",
    "  scryglass check          compare engine output to fixtures/expected",
    "  scryglass --help         this text",
    "",
    "Job 2 is computed. Jev is not called.",
  ].join("\n");
}

function render(report: ReturnType<typeof analyzeFixtureRepo>["reports"][number]): string {
  const lines = [
    `PR ${report.id}  ${report.title}`,
    `WHAT   ${report.what}`,
    `RISK   ${report.risk}   (deterministic flags; Jev unused)`,
    `KEYS   ${report.keyPoints.join(", ")}`,
    `PR     ${report.flags.map((item) => item.id).join(", ") || "—"}`,
    "",
  ];
  for (const node of report.changed) {
    lines.push(
      `${node.risk.padEnd(6)}  ${node.file}`,
      `        ${node.flags.map((item) => `${item.severity}:${item.id}`).join(" · ") || "—"}`,
      `        ${node.reasons.join(" · ")}`,
      `        routes: ${node.routes.join(", ") || "—"}`,
      `        pages:  ${node.pages.join(", ") || "—"}`,
      `        tests:  ${node.tests.join(", ") || "—"}`,
      "",
    );
  }
  return lines.join("\n");
}

function main(argv: string[]): number {
  const args = argv.slice(2);
  if (args.includes("--help") || args[0] === "help") {
    console.info(help());
    return 0;
  }

  const host = createFixtureHost();
  const fs = createDiskRepoFs(loomShopRoot());
  const { graph, reports } = analyzeFixtureRepo(fs, host.listPullRequests());
  assertLayerInvariants(graph);

  if (args[0] === "check") {
    const expectedRoot = join(fixturesRoot(), "expected");
    let failed = 0;
    for (const report of reports) {
      const want = readFileSync(join(expectedRoot, `${report.id}.json`), "utf8");
      const actual = `${JSON.stringify(report, null, 2)}\n`;
      if (actual !== want) {
        console.error(`DRIFT ${report.id}`);
        failed += 1;
      } else {
        console.info(`OK ${report.id} risk=${report.risk} keys=${report.keyPoints.join(",")}`);
      }
    }
    return failed ? 1 : 0;
  }

  if (args[0] === "write-expected") {
    const expectedRoot = join(fixturesRoot(), "expected");
    for (const report of reports) {
      writeFileSync(
        join(expectedRoot, `${report.id}.json`),
        `${JSON.stringify(report, null, 2)}\n`,
      );
    }
    console.info(`Wrote ${reports.length} goldens`);
    return 0;
  }

  const prFilter = args[0] === "open" ? args[1] : args[0];
  const selected = prFilter
    ? reports.filter((report) => report.id === prFilter || report.id === `PR-${prFilter}`)
    : reports;
  if (prFilter && !selected.length) {
    console.error(`Unknown PR ${prFilter}`);
    return 1;
  }
  for (const report of selected) {
    console.info(render(report));
    console.info("-".repeat(72));
  }
  if (args[0] === "open") {
    console.info("High Seat: npm run dev  →  http://127.0.0.1:8787");
  }
  return 0;
}

process.exitCode = main(process.argv);
