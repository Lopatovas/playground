import { Injectable } from "@nestjs/common";
import { Prisma, type Scan } from "@prisma/client";
import type { ScanListItem, ScanReport, ScanStatus } from "@ai-readiness/shared";
import { PrismaService } from "../prisma/prisma.service.js";

export interface CreateQueuedScanInput {
  tenantId: string;
  datasetName: string;
  audience: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number;
  fileBuffer: Buffer;
}

export interface ScanRepositoryLike {
  createQueuedScan(input: CreateQueuedScanInput): Promise<ScanReport>;
  listScans(tenantId: string): Promise<ScanListItem[]>;
  getReport(tenantId: string, scanId: string): Promise<ScanReport | null>;
  getRawScan(scanId: string): Promise<Scan | null>;
  findPreviousCompletedReport(input: { tenantId: string; datasetName: string; before: Date; excludeScanId: string }): Promise<ScanReport | undefined>;
  markProcessing(scanId: string): Promise<void>;
  completeScan(scanId: string, report: ScanReport): Promise<void>;
  failScan(scanId: string, errorMessage: string): Promise<void>;
}

@Injectable()
export class ScansRepository implements ScanRepositoryLike {
  constructor(private readonly prisma: PrismaService) {}

  async createQueuedScan(input: CreateQueuedScanInput): Promise<ScanReport> {
    const scan = await this.prisma.scan.create({
      data: {
        tenantId: input.tenantId,
        datasetName: input.datasetName,
        audience: input.audience,
        originalFileName: input.originalFileName,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        fileBuffer: new Uint8Array(input.fileBuffer),
        status: "queued",
      },
    });

    return scanToReport(scan);
  }

  async listScans(tenantId: string): Promise<ScanListItem[]> {
    const scans = await this.prisma.scan.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return scans.map((scan) => ({
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
    const scan = await this.prisma.scan.findFirst({
      where: { id: scanId, tenantId },
    });

    return scan ? scanToReport(scan) : null;
  }

  async getRawScan(scanId: string): Promise<Scan | null> {
    return this.prisma.scan.findUnique({ where: { id: scanId } });
  }

  async findPreviousCompletedReport(input: {
    tenantId: string;
    datasetName: string;
    before: Date;
    excludeScanId: string;
  }): Promise<ScanReport | undefined> {
    const scan = await this.prisma.scan.findFirst({
      where: {
        tenantId: input.tenantId,
        datasetName: { equals: input.datasetName, mode: "insensitive" },
        status: "completed",
        id: { not: input.excludeScanId },
        createdAt: { lt: input.before },
      },
      orderBy: { createdAt: "desc" },
    });

    return scan ? scanToReport(scan) : undefined;
  }

  async markProcessing(scanId: string): Promise<void> {
    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: "processing", errorMessage: null },
    });
  }

  async completeScan(scanId: string, report: ScanReport): Promise<void> {
    await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "completed",
        overallScore: report.overallScore,
        report: report as unknown as Prisma.InputJsonValue,
        completedAt: report.completedAt ? new Date(report.completedAt) : new Date(),
        fileBuffer: null,
        errorMessage: null,
      },
    });
  }

  async failScan(scanId: string, errorMessage: string): Promise<void> {
    await this.prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "failed",
        errorMessage,
        completedAt: new Date(),
        fileBuffer: null,
      },
    });
  }
}

export function scanToReport(scan: Scan): ScanReport {
  if (scan.report && typeof scan.report === "object") {
    return scan.report as unknown as ScanReport;
  }

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
      nextSteps: status === "failed" ? ["Review the scan error and upload again."] : ["Refresh this report after the queue completes."],
    },
    actionPlan: [],
    profiles: [],
    findings: [],
  };
}
