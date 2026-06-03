import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { ScanListItem, ScanReport } from "@ai-readiness/shared";
import { randomUUID } from "node:crypto";
import { FileParserService } from "../scanner/file-parser.service.js";
import { ProfilingService } from "../scanner/profiling.service.js";
import { RiskDetectorService } from "../scanner/risk-detector.service.js";
import { ScoringService } from "../scanner/scoring.service.js";
import { ReportService } from "../scanner/report.service.js";

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

@Injectable()
export class ScansService {
  private readonly reports = new Map<string, ScanReport>();
  private readonly scanOrder: string[] = [];

  constructor(
    private readonly fileParser: FileParserService,
    private readonly profiler: ProfilingService,
    private readonly riskDetector: RiskDetectorService,
    private readonly scoring: ScoringService,
    private readonly reportService: ReportService,
  ) {}

  listScans(): ScanListItem[] {
    return this.scanOrder
      .map((id) => this.reports.get(id))
      .filter((report): report is ScanReport => Boolean(report))
      .map((report) => ({
        id: report.scanId,
        datasetName: report.datasetName,
        status: report.status,
        createdAt: report.createdAt,
        completedAt: report.completedAt,
        overallScore: report.overallScore,
        findingCount: report.findings.length,
      }))
      .reverse();
  }

  getReport(scanId: string): ScanReport {
    const report = this.reports.get(scanId);

    if (!report) {
      throw new NotFoundException(`Scan ${scanId} was not found.`);
    }

    return report;
  }

  async createScan(file: UploadedDatasetFile | undefined, options: CreateScanOptions): Promise<ScanReport> {
    if (!file) {
      throw new BadRequestException("Upload a CSV or XLSX file using the 'file' field.");
    }

    if (file.size === 0) {
      throw new BadRequestException("Uploaded file is empty.");
    }

    const scanId = randomUUID();
    const createdAt = new Date().toISOString();
    const datasetName = options.datasetName?.trim() || file.originalname.replace(/\.[^.]+$/, "");
    const previousReport = this.findPreviousReport(datasetName);
    const tables = await this.fileParser.parseFile(file.originalname, file.buffer);
    const profiles = this.profiler.profileTables(tables);
    const findings = this.riskDetector.detectFindings(profiles);
    const { overallScore, scoreBreakdown } = this.scoring.score(findings);
    const completedAt = new Date().toISOString();

    const report = await this.reportService.buildReport({
      scanId,
      datasetName,
      createdAt,
      completedAt,
      overallScore,
      scoreBreakdown,
      profiles,
      findings,
      previousReport,
      audience: options.audience ?? "mixed",
    });

    this.reports.set(scanId, report);
    this.scanOrder.push(scanId);

    return report;
  }

  private findPreviousReport(datasetName: string): ScanReport | undefined {
    return [...this.scanOrder]
      .reverse()
      .map((id) => this.reports.get(id))
      .find((report) => report?.datasetName.toLowerCase() === datasetName.toLowerCase());
  }
}
