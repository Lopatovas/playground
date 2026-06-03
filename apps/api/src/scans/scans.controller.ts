import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { ScanListItem, ScanReport } from "@ai-readiness/shared";
import { ScansService, type UploadedDatasetFile } from "./scans.service.js";

const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 100 * 1024 * 1024);

@Controller()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Get("health")
  health(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("scans")
  listScans(): ScanListItem[] {
    return this.scansService.listScans();
  }

  @Get("scans/:scanId")
  getScan(@Param("scanId") scanId: string): ScanReport {
    return this.scansService.getReport(scanId);
  }

  @Get("scans/:scanId/report")
  getReport(@Param("scanId") scanId: string): ScanReport {
    return this.scansService.getReport(scanId);
  }

  @Post("scans/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: maxUploadBytes },
    }),
  )
  uploadScan(
    @UploadedFile() file: UploadedDatasetFile | undefined,
    @Body("datasetName") datasetName?: string,
    @Body("audience") audience?: string,
  ): Promise<ScanReport> {
    return this.scansService.createScan(file, { datasetName, audience });
  }
}
