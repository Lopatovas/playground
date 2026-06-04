import { describe, expect, it } from "vitest";
import type { ScanReport } from "@ai-readiness/shared";
import { ReportChatService } from "../report-chat.service.js";

const completedReport: ScanReport = {
  scanId: "scan-1",
  tenantId: "tenant-a",
  datasetName: "customers",
  status: "completed",
  createdAt: "2026-06-03T00:00:00.000Z",
  completedAt: "2026-06-03T00:00:01.000Z",
  overallScore: 78,
  scoreBreakdown: [],
  summary: {
    headline: "This dataset scores 78/100 for AI readiness.",
    businessImpact: "Impact",
    topRisks: ["PII"],
    nextSteps: ["Fix PII"],
  },
  actionPlan: [],
  profiles: [],
  findings: [],
  reportAudience: "mixed",
};

class StubLlmService {
  constructor(
    private readonly configured: boolean,
    private readonly reply: { reply: string; refused: boolean } | null,
  ) {}

  isConfigured() {
    return this.configured;
  }

  async chatAboutReport() {
    return this.reply;
  }
}

describe("ReportChatService", () => {
  it("rejects obviously off-topic questions without calling the model", async () => {
    const service = new ReportChatService(new StubLlmService(true, null) as never);
    const response = await service.askAboutReport(completedReport, "Give me a chocolate cake recipe");

    expect(response.refused).toBe(true);
    expect(response.reply).toContain("only answer questions about this readiness scan");
  });

  it("returns model reply for on-topic questions", async () => {
    const service = new ReportChatService(
      new StubLlmService(true, { reply: "Privacy score is low because of PII findings.", refused: false }) as never,
    );
    const response = await service.askAboutReport(completedReport, "Why is privacy compliance important in this report?");

    expect(response.refused).toBe(false);
    expect(response.reply).toContain("PII");
  });
});
