import { BadRequestException, Body, Controller, Get, Headers, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
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
  listScans(@Headers("x-tenant-id") tenantIdHeader?: string): ScanListItem[] {
    return this.scansService.listScans(resolveTenantId(tenantIdHeader));
  }

  @Get("scans/:scanId")
  getScan(@Headers("x-tenant-id") tenantIdHeader: string | undefined, @Param("scanId") scanId: string): ScanReport {
    return this.scansService.getReport(resolveTenantId(tenantIdHeader), scanId);
  }

  @Get("scans/:scanId/report")
  getReport(@Headers("x-tenant-id") tenantIdHeader: string | undefined, @Param("scanId") scanId: string): ScanReport {
    return this.scansService.getReport(resolveTenantId(tenantIdHeader), scanId);
  }

  @Post("scans/upload")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: maxUploadBytes },
    }),
  )
  uploadScan(
    @Headers("x-tenant-id") tenantIdHeader: string | undefined,
    @UploadedFile() file: UploadedDatasetFile | undefined,
    @Body("datasetName") datasetName?: string,
    @Body("audience") audience?: string,
  ): Promise<ScanReport> {
    return this.scansService.createScan(resolveTenantId(tenantIdHeader), file, { datasetName, audience });
  }
}

function resolveTenantId(tenantIdHeader: string | undefined): string {
  const tenantId = tenantIdHeader?.trim();

  if (!tenantId) {
    throw new BadRequestException("Missing x-tenant-id header.");
  }

  if (tenantId.length > 80 || !/^[a-zA-Z0-9._:-]+$/.test(tenantId)) {
    throw new BadRequestException("Invalid x-tenant-id header. Use 1-80 letters, numbers, dots, underscores, colons or hyphens.");
  }

  return tenantId.toLowerCase();
}
