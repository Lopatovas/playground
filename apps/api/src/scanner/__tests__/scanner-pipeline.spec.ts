import { describe, expect, it } from "vitest";
import { FileParserService } from "../file-parser.service.js";
import { ProfilingService } from "../profiling.service.js";
import { ReportService } from "../report.service.js";
import { RiskDetectorService } from "../risk-detector.service.js";
import { ScoringService } from "../scoring.service.js";
import { ScansService } from "../../scans/scans.service.js";
import type { ReportEnhancementInput } from "../../llm/llm-provider.interface.js";

class CapturingLlmService {
  inputs: ReportEnhancementInput[] = [];

  async generateReportEnhancement(input: ReportEnhancementInput) {
    this.inputs.push(input);
    return null;
  }
}

function createScansService(capturingLlm = new CapturingLlmService()) {
  return {
    scansService: new ScansService(
      new FileParserService(),
      new ProfilingService(),
      new RiskDetectorService(),
      new ScoringService(),
      new ReportService(capturingLlm as never),
    ),
    capturingLlm,
  };
}

function csvBuffer(contents: string): Buffer {
  return Buffer.from(contents.trim() + "\n", "utf8");
}

describe("scanner pipeline", () => {
  it("generates traceable findings and weighted scores from a CSV upload", async () => {
    const { scansService } = createScansService();

    const report = await scansService.createScan(
      "tenant-a",
      {
        originalname: "players.csv",
        buffer: csvBuffer(
          [
            "player_id,email,signup_date,status_old,revenue",
            "1,a@example.com,2026-01-01,active,100",
            "2,b@example.com,,active,200",
            "2,b@example.com,,active,200",
            "3,,2026-03-01,,0",
          ].join("\n"),
        ),
        size: 150,
        mimetype: "text/csv",
      },
      { datasetName: "players", audience: "mixed" },
    );

    expect(report.status).toBe("completed");
    expect(report.tenantId).toBe("tenant-a");
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThan(100);
    expect(report.scoreBreakdown).toHaveLength(5);
    expect(report.profiles[0]).toMatchObject({
      name: "players",
      rowCount: 4,
      columnCount: 5,
      duplicateRows: 1,
    });

    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "PRIVACY_COMPLIANCE",
          title: "Potential PII detected",
          columnName: "email",
          ruleId: "privacy.pii.detected",
        }),
        expect.objectContaining({
          category: "SCHEMA_CLARITY",
          title: "Ambiguous column name",
          columnName: "status_old",
          ruleId: "schema.column_name.ambiguous",
        }),
        expect.objectContaining({
          category: "DATA_QUALITY",
          title: "High duplicate row rate",
          ruleId: "table.duplicates.high",
        }),
      ]),
    );

    expect(report.actionPlan.length).toBeGreaterThan(0);
    expect(report.actionPlan[0]?.priority).toBe("P1");
  });

  it("sends only aggregate findings and scores to the LLM enhancement layer", async () => {
    const { scansService, capturingLlm } = createScansService();

    await scansService.createScan(
      "tenant-a",
      {
        originalname: "customers.csv",
        buffer: csvBuffer(
          [
            "customer_id,email,phone",
            "1,secret.person@example.com,+37060000000",
            "2,another.secret@example.com,+37060000001",
          ].join("\n"),
        ),
        size: 120,
        mimetype: "text/csv",
      },
      { datasetName: "customers", audience: "compliance" },
    );

    expect(capturingLlm.inputs).toHaveLength(1);
    const serializedInput = JSON.stringify(capturingLlm.inputs[0]);

    expect(serializedInput).toContain("privacy.pii.detected");
    expect(serializedInput).toContain("email");
    expect(serializedInput).not.toContain("secret.person@example.com");
    expect(serializedInput).not.toContain("another.secret@example.com");
    expect(serializedInput).not.toContain("+37060000000");
  });

  it("isolates scan history, reports and comparison by tenant", async () => {
    const { scansService } = createScansService();

    const tenantAFirst = await scansService.createScan(
      "tenant-a",
      {
        originalname: "shared.csv",
        buffer: csvBuffer(
          [
            "player_id,email,status_old",
            "1,a@example.com,active",
            "1,a@example.com,active",
            "2,b@example.com,active",
          ].join("\n"),
        ),
        size: 100,
        mimetype: "text/csv",
      },
      { datasetName: "shared_players", audience: "mixed" },
    );

    const tenantBScan = await scansService.createScan(
      "tenant-b",
      {
        originalname: "shared.csv",
        buffer: csvBuffer(
          [
            "player_id,email,created_at",
            "1,c@example.com,2026-01-01",
            "2,d@example.com,2026-01-02",
          ].join("\n"),
        ),
        size: 100,
        mimetype: "text/csv",
      },
      { datasetName: "shared_players", audience: "mixed" },
    );

    const tenantASecond = await scansService.createScan(
      "tenant-a",
      {
        originalname: "shared.csv",
        buffer: csvBuffer(
          [
            "player_id,email,created_at",
            "1,,2026-01-01",
            "2,,2026-01-02",
          ].join("\n"),
        ),
        size: 100,
        mimetype: "text/csv",
      },
      { datasetName: "shared_players", audience: "mixed" },
    );

    expect(scansService.listScans("tenant-a").map((scan) => scan.id)).toEqual([tenantASecond.scanId, tenantAFirst.scanId]);
    expect(scansService.listScans("tenant-b").map((scan) => scan.id)).toEqual([tenantBScan.scanId]);
    expect(scansService.getReport("tenant-a", tenantAFirst.scanId)).toBe(tenantAFirst);
    expect(() => scansService.getReport("tenant-b", tenantAFirst.scanId)).toThrow();
    expect(tenantASecond.comparison?.previousScanId).toBe(tenantAFirst.scanId);
    expect(tenantASecond.comparison?.previousScanId).not.toBe(tenantBScan.scanId);
  });

  it("compares recurring scans for the same dataset name", async () => {
    const { scansService } = createScansService();

    const firstReport = await scansService.createScan(
      "tenant-a",
      {
        originalname: "monthly.csv",
        buffer: csvBuffer(
          [
            "player_id,email,status_old",
            "1,a@example.com,active",
            "1,a@example.com,active",
            "2,b@example.com,active",
          ].join("\n"),
        ),
        size: 100,
        mimetype: "text/csv",
      },
      { datasetName: "monthly_players", audience: "mixed" },
    );

    const secondReport = await scansService.createScan(
      "tenant-a",
      {
        originalname: "monthly.csv",
        buffer: csvBuffer(
          [
            "player_id,email,created_at",
            "1,,2026-01-01",
            "2,,2026-01-02",
            "3,,2026-01-03",
          ].join("\n"),
        ),
        size: 100,
        mimetype: "text/csv",
      },
      { datasetName: "monthly_players", audience: "mixed" },
    );

    expect(secondReport.comparison).toMatchObject({
      previousScanId: firstReport.scanId,
      currentScanId: secondReport.scanId,
    });
    expect(secondReport.comparison?.categoryDeltas).toHaveLength(5);
    expect(typeof secondReport.comparison?.scoreDelta).toBe("number");
  });
});
