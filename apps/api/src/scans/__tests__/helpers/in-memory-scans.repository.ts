import type { Scan } from "@prisma/client";
import type { ScanListItem, ScanReport, ScanStatus } from "@ai-readiness/shared";
import type { CreateQueuedScanInput, ScanRepositoryLike } from "../../scans.repository.js";

export class InMemoryScansRepository implements ScanRepositoryLike {
  private readonly scans = new Map<string, Scan>();
  private timestampOffset = 0;

  async createQueuedScan(input: CreateQueuedScanInput): Promise<ScanReport> {
    const now = new Date(Date.now() + this.timestampOffset++);
    const scan: Scan = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      datasetName: input.datasetName,
      status: "queued",
      audience: input.audience,
      originalFileName: input.originalFileName,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      fileBuffer: new Uint8Array(input.fileBuffer),
      overallScore: null,
      report: null,
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };
    this.scans.set(scan.id, scan);
    return scanToReport(scan);
  }

  async listScans(tenantId: string): Promise<ScanListItem[]> {
    return [...this.scans.values()]
      .filter((scan) => scan.tenantId === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((scan) => ({
        id: scan.id,
        tenantId: scan.tenantId,
        datasetName: scan.datasetName,
        status: scan.status,
        createdAt: scan.createdAt.toISOString(),
        completedAt: scan.completedAt?.toISOString(),
        overallScore: scan.overallScore ?? undefined,
        findingCount: scanToReport(scan).findings.length,
      }));
  }

  async getReport(tenantId: string, scanId: string): Promise<ScanReport | null> {
    const scan = this.scans.get(scanId);
    if (!scan || scan.tenantId !== tenantId) return null;
    return scanToReport(scan);
  }

  async getRawScan(scanId: string): Promise<Scan | null> {
    return this.scans.get(scanId) ?? null;
  }

  async findPreviousCompletedReport(input: { tenantId: string; datasetName: string; before: Date; excludeScanId: string }): Promise<ScanReport | undefined> {
    return [...this.scans.values()]
      .filter(
        (scan) =>
          scan.tenantId === input.tenantId &&
          scan.datasetName.toLowerCase() === input.datasetName.toLowerCase() &&
          scan.status === "completed" &&
          scan.id !== input.excludeScanId &&
          scan.createdAt.getTime() < input.before.getTime(),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(scanToReport)[0];
  }

  async markProcessing(scanId: string): Promise<void> {
    const scan = this.requireScan(scanId);
    this.scans.set(scanId, { ...scan, status: "processing", updatedAt: new Date(), errorMessage: null });
  }

  async completeScan(scanId: string, report: ScanReport): Promise<void> {
    const scan = this.requireScan(scanId);
    this.scans.set(scanId, {
      ...scan,
      status: "completed",
      overallScore: report.overallScore,
      report: report as never,
      completedAt: report.completedAt ? new Date(report.completedAt) : new Date(),
      updatedAt: new Date(),
      fileBuffer: null,
      errorMessage: null,
    });
  }

  async failScan(scanId: string, errorMessage: string): Promise<void> {
    const scan = this.requireScan(scanId);
    this.scans.set(scanId, {
      ...scan,
      status: "failed",
      errorMessage,
      completedAt: new Date(),
      updatedAt: new Date(),
      fileBuffer: null,
    });
  }

  private requireScan(scanId: string): Scan {
    const scan = this.scans.get(scanId);
    if (!scan) throw new Error(`Scan ${scanId} not found`);
    return scan;
  }
}

function scanToReport(scan: Scan): ScanReport {
  if (scan.report && typeof scan.report === "object") return scan.report as unknown as ScanReport;
  const status = scan.status as ScanStatus;
  return {
    scanId: scan.id,
    tenantId: scan.tenantId,
    datasetName: scan.datasetName,
    status,
    createdAt: scan.createdAt.toISOString(),
    completedAt: scan.completedAt?.toISOString(),
    overallScore: scan.overallScore ?? 0,
    scoreBreakdown: [],
    summary: {
      headline: status === "failed" ? "Scan failed." : "Scan is queued for processing.",
      businessImpact: scan.errorMessage ?? "The dataset has been accepted and will be processed by the scan queue.",
      topRisks: [],
      nextSteps: [],
    },
    actionPlan: [],
    profiles: [],
    findings: [],
  };
}
