import { describe, expect, it, vi } from "vitest";
import type { ScanReport } from "@ai-readiness/shared";
import { ScansController } from "../scans.controller.js";
import type { ScansService, UploadedDatasetFile } from "../scans.service.js";

function report(overrides: Partial<ScanReport> = {}): ScanReport {
  return {
    scanId: overrides.scanId ?? "scan-1",
    tenantId: overrides.tenantId ?? "tenant-a",
    datasetName: overrides.datasetName ?? "customers",
    status: overrides.status ?? "completed",
    createdAt: overrides.createdAt ?? "2026-06-03T00:00:00.000Z",
    completedAt: overrides.completedAt ?? "2026-06-03T00:00:01.000Z",
    overallScore: overrides.overallScore ?? 80,
    scoreBreakdown: overrides.scoreBreakdown ?? [],
    summary: overrides.summary ?? { headline: "Ready", businessImpact: "Good", topRisks: [], nextSteps: [] },
    actionPlan: overrides.actionPlan ?? [],
    profiles: overrides.profiles ?? [],
    findings: overrides.findings ?? [],
    comparison: overrides.comparison,
  };
}

describe("ScansController", () => {
  it("returns health status", () => {
    const controller = new ScansController({} as ScansService);

    expect(controller.health()).toEqual({ status: "ok" });
  });

  it("delegates list and report reads to ScansService", () => {
    const scanReport = report();
    const service = {
      listScans: vi.fn(() => [{ id: "scan-1", tenantId: "tenant-a", datasetName: "customers", status: "completed", createdAt: scanReport.createdAt }]),
      getReport: vi.fn(() => scanReport),
      createScan: vi.fn(),
    } as unknown as ScansService;
    const controller = new ScansController(service);

    expect(controller.listScans("tenant-a")).toEqual([{ id: "scan-1", tenantId: "tenant-a", datasetName: "customers", status: "completed", createdAt: scanReport.createdAt }]);
    expect(controller.getReport("tenant-a", "scan-1")).toBe(scanReport);
    expect(service.listScans).toHaveBeenCalledWith("tenant-a");
    expect(service.getReport).toHaveBeenCalledWith("tenant-a", "scan-1");
  });

  it("requires a tenant header", () => {
    const controller = new ScansController({} as ScansService);

    expect(() => controller.listScans(undefined)).toThrow("Missing x-tenant-id header.");
  });

  it("delegates uploads with dataset and audience options", async () => {
    const scanReport = report({ scanId: "scan-upload" });
    const service = {
      listScans: vi.fn(),
      getReport: vi.fn(),
      createScan: vi.fn(async () => scanReport),
    } as unknown as ScansService;
    const controller = new ScansController(service);
    const file: UploadedDatasetFile = {
      originalname: "customers.csv",
      buffer: Buffer.from(["customer_id,email", "1,a@example.com"].join(String.fromCharCode(10))),
      size: 35,
      mimetype: "text/csv",
    };

    await expect(controller.uploadScan("tenant-a", file, "customers", "technical")).resolves.toBe(scanReport);
    expect(service.createScan).toHaveBeenCalledWith("tenant-a", file, { datasetName: "customers", audience: "technical" });
  });
});
