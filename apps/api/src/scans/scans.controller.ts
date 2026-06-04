import { BadRequestException, Body, Controller, Get, Headers, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBody, ApiConsumes, ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { ReportChatRequest, ReportChatResponse, ScanListItem, ScanReport } from "@ai-readiness/shared";
import { ScansService, type UploadedDatasetFile } from "./scans.service.js";

const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES ?? 100 * 1024 * 1024);

@ApiTags("scans")
@Controller()
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  @ApiOkResponse({ schema: { example: { status: "ok" } } })
  health(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("scans")
  @ApiOperation({ summary: "List scans for a tenant" })
  @ApiHeader({ name: "x-tenant-id", required: true, description: "Tenant/company identifier for POC isolation." })
  @ApiOkResponse({ description: "Tenant-scoped scan history." })
  listScans(@Headers("x-tenant-id") tenantIdHeader?: string): Promise<ScanListItem[]> {
    return this.scansService.listScans(resolveTenantId(tenantIdHeader));
  }

  @Get("scans/:scanId")
  @ApiOperation({ summary: "Get a tenant-scoped scan report" })
  @ApiHeader({ name: "x-tenant-id", required: true })
  @ApiParam({ name: "scanId" })
  getScan(@Headers("x-tenant-id") tenantIdHeader: string | undefined, @Param("scanId") scanId: string): Promise<ScanReport> {
    return this.scansService.getReport(resolveTenantId(tenantIdHeader), scanId);
  }

  @Get("scans/:scanId/report")
  @ApiOperation({ summary: "Get a tenant-scoped scan report" })
  @ApiHeader({ name: "x-tenant-id", required: true })
  @ApiParam({ name: "scanId" })
  getReport(@Headers("x-tenant-id") tenantIdHeader: string | undefined, @Param("scanId") scanId: string): Promise<ScanReport> {
    return this.scansService.getReport(resolveTenantId(tenantIdHeader), scanId);
  }

  @Post("scans/:scanId/chat")
  @ApiOperation({ summary: "Ask questions about a completed scan report (LLM, report-scoped only)" })
  @ApiHeader({ name: "x-tenant-id", required: true })
  @ApiParam({ name: "scanId" })
  chatAboutReport(
    @Headers("x-tenant-id") tenantIdHeader: string | undefined,
    @Param("scanId") scanId: string,
    @Body() body: ReportChatRequest,
  ): Promise<ReportChatResponse> {
    return this.scansService.chatAboutReport(resolveTenantId(tenantIdHeader), scanId, body.message, body.history ?? []);
  }

  @Post("scans/upload")
  @ApiOperation({ summary: "Upload a CSV/XLSX dataset and enqueue a readiness scan" })
  @ApiHeader({ name: "x-tenant-id", required: true })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["file"],
      properties: {
        file: { type: "string", format: "binary" },
        datasetName: { type: "string", example: "player_activity" },
        audience: { type: "string", example: "mixed" },
      },
    },
  })
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
