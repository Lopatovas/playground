import type { ReportChatMessage, ReportChatResponse, ScanListItem, ScanReport } from "@ai-readiness/shared";

const configuredBase = import.meta.env.VITE_API_BASE_URL;
const apiBaseUrl =
  configuredBase === undefined || configuredBase === "" ? "" : configuredBase.replace(/\/$/, "");

export async function uploadScan(input: {
  tenantId: string;
  file: File;
  datasetName: string;
  audience: string;
}): Promise<ScanReport> {
  const body = new FormData();
  body.append("file", input.file);
  body.append("datasetName", input.datasetName);
  body.append("audience", input.audience);

  const response = await fetch(`${apiBaseUrl}/scans/upload`, {
    method: "POST",
    headers: tenantHeaders(input.tenantId),
    body,
  });

  return parseResponse<ScanReport>(response);
}

export async function listScans(tenantId: string): Promise<ScanListItem[]> {
  const response = await fetch(`${apiBaseUrl}/scans`, {
    headers: tenantHeaders(tenantId),
  });
  return parseResponse<ScanListItem[]>(response);
}

export async function getScan(tenantId: string, scanId: string): Promise<ScanReport> {
  const response = await fetch(`${apiBaseUrl}/scans/${scanId}/report`, {
    headers: tenantHeaders(tenantId),
  });
  return parseResponse<ScanReport>(response);
}

export async function chatAboutReport(input: {
  tenantId: string;
  scanId: string;
  message: string;
  history?: ReportChatMessage[];
}): Promise<ReportChatResponse> {
  const response = await fetch(`${apiBaseUrl}/scans/${input.scanId}/chat`, {
    method: "POST",
    headers: {
      ...tenantHeaders(input.tenantId),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: input.message,
      history: input.history ?? [],
    }),
  });

  return parseResponse<ReportChatResponse>(response);
}

function tenantHeaders(tenantId: string): HeadersInit {
  return {
    "x-tenant-id": tenantId.trim().toLowerCase(),
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
