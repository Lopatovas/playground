import type { ScanListItem, ScanReport } from "@ai-readiness/shared";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function uploadScan(input: {
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
    body,
  });

  return parseResponse<ScanReport>(response);
}

export async function listScans(): Promise<ScanListItem[]> {
  const response = await fetch(`${apiBaseUrl}/scans`);
  return parseResponse<ScanListItem[]>(response);
}

export async function getScan(scanId: string): Promise<ScanReport> {
  const response = await fetch(`${apiBaseUrl}/scans/${scanId}/report`);
  return parseResponse<ScanReport>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}
