import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Job, Queue } from "bullmq";
import type { ScanListItem, ScanReport } from "@ai-readiness/shared";
import { FileParserService } from "../scanner/file-parser.service.js";
import { ProfilingService } from "../scanner/profiling.service.js";
import { RiskDetectorService } from "../scanner/risk-detector.service.js";
import { ScoringService } from "../scanner/scoring.service.js";
import { ReportService } from "../scanner/report.service.js";
import type { ScanRepositoryLike } from "./scans.repository.js";
import { ScansRepository } from "./scans.repository.js";

export const SCAN_QUEUE_NAME = "scan-processing";
export const SCAN_JOB_NAME = "process-scan";

export interface ScanJobData {
  scanId: string;
}

export interface UploadedDatasetFile {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

export interface CreateScanOptions {
  datasetName?: string;
  audience?: string;
}

export interface ScanQueueLike {
  add(name: string, data: ScanJobData, options?: Record<string, unknown>): Promise<unknown>;
}

@Injectable()
export class ScansService {
  constructor(
    private readonly repository: ScansRepository,
    private readonly fileParser: FileParserService,
    private readonly profiler: ProfilingService,
    private readonly riskDetector: RiskDetectorService,
    private readonly scoring: ScoringService,
    private readonly reportService: ReportService,
    @InjectQueue(SCAN_QUEUE_NAME) private readonly scanQueue: Queue<ScanJobData>,
  ) {}

  async listScans(tenantId: string): Promise<ScanListItem[]> {
    return this.repository.listScans(tenantId);
  }

  async getReport(tenantId: string, scanId: string): Promise<ScanReport> {
    const report = await this.repository.getReport(tenantId, scanId);

    if (!report) {
      throw new NotFoundException(`Scan ${scanId} was not found.`);
    }

    return report;
  }

  async createScan(tenantId: string, file: UploadedDatasetFile | undefined, options: CreateScanOptions): Promise<ScanReport> {
    if (!file) {
      throw new BadRequestException("Upload a CSV or XLSX file using the 'file' field.");
    }

    if (file.size === 0) {
      throw new BadRequestException("Uploaded file is empty.");
    }

    const datasetName = options.datasetName?.trim() || file.originalname.replace(/\.[^.]+$/, "");
    const queuedReport = await this.repository.createQueuedScan({
      tenantId,
      datasetName,
      audience: options.audience ?? "mixed",
      originalFileName: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.size,
      fileBuffer: file.buffer,
    });

    await this.scanQueue.add(
      SCAN_JOB_NAME,
      { scanId: queuedReport.scanId },
      {
        attempts: 1,
        removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
        removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 },
      },
    );

    return queuedReport;
  }

  async processScanJob(jobOrData: Job<ScanJobData> | ScanJobData): Promise<ScanReport> {
    const scanId = "data" in jobOrData ? jobOrData.data.scanId : jobOrData.scanId;
    const scan = await this.repository.getRawScan(scanId);

    if (!scan) {
      throw new NotFoundException(`Scan ${scanId} was not found.`);
    }

    if (!scan.fileBuffer || !scan.originalFileName) {
      throw new BadRequestException(`Scan ${scanId} has no uploaded file payload.`);
    }

    await this.repository.markProcessing(scanId);

    try {
      const previousReport = await this.repository.findPreviousCompletedReport({
        tenantId: scan.tenantId,
        datasetName: scan.datasetName,
        before: scan.createdAt,
        excludeScanId: scan.id,
      });
      const tables = await this.fileParser.parseFile(scan.originalFileName, Buffer.from(scan.fileBuffer));
      const profiles = this.profiler.profileTables(tables);
      const findings = this.riskDetector.detectFindings(profiles);
      const { overallScore, scoreBreakdown } = this.scoring.score(findings);
      const completedAt = new Date().toISOString();

      const report = await this.reportService.buildReport({
        scanId,
        tenantId: scan.tenantId,
        datasetName: scan.datasetName,
        createdAt: scan.createdAt.toISOString(),
        completedAt,
        overallScore,
        scoreBreakdown,
        profiles,
        findings,
        previousReport,
        audience: scan.audience,
      });

      await this.repository.completeScan(scanId, report);
      return report;
    } catch (error) {
      await this.repository.failScan(scanId, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
}
