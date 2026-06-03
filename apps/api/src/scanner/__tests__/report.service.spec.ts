import { describe, expect, it } from "vitest";
import type { ActionItem, ReportSummary, ScanFinding, ScoreBreakdown, TableProfile } from "@ai-readiness/shared";
import { ReportService } from "../report.service.js";
import type { ReportEnhancementInput } from "../../llm/llm-provider.interface.js";

function finding(overrides: Partial<ScanFinding> = {}): ScanFinding {
  return {
    id: overrides.id ?? "finding-1",
    category: overrides.category ?? "PRIVACY_COMPLIANCE",
    severity: overrides.severity ?? "high",
    title: overrides.title ?? "Potential PII detected",
    description: overrides.description ?? "Personal data needs controls before AI use.",
    tableName: overrides.tableName ?? "customers",
    columnName: overrides.columnName ?? "email",
    affectedRowsPercent: overrides.affectedRowsPercent ?? 98,
    evidence: overrides.evidence ?? "Detected email signals.",
    scoreImpact: overrides.scoreImpact ?? 14,
    recommendation: overrides.recommendation ?? "Mask or exclude this field before AI usage.",
    ruleId: overrides.ruleId ?? "privacy.pii.detected",
  };
}

const scoreBreakdown: ScoreBreakdown[] = [
  { category: "dataQuality", label: "Data Quality", score: 90, weight: 0.3, rationale: "Good" },
  { category: "privacyCompliance", label: "Privacy & Compliance", score: 60, weight: 0.25, rationale: "PII" },
  { category: "schemaClarity", label: "Schema Clarity", score: 90, weight: 0.2, rationale: "Good" },
  { category: "aiUsability", label: "AI Usability", score: 90, weight: 0.15, rationale: "Good" },
  { category: "monitoringReadiness", label: "Monitoring Readiness", score: 80, weight: 0.1, rationale: "Good" },
];

const profiles: TableProfile[] = [
  {
    name: "customers",
    rowCount: 100,
    columnCount: 1,
    duplicateRows: 0,
    duplicateRowsPercent: 0,
    columns: [
      {
        name: "email",
        inferredType: "email",
        totalRows: 100,
        missingCount: 0,
        missingPercent: 0,
        uniqueCount: 98,
        uniquePercent: 98,
        piiTypes: ["email"],
        samplePatterns: ["email"],
      },
    ],
  },
];

class StubLlmService {
  constructor(private readonly output: null | { summary?: ReportSummary; actionPlan?: ActionItem[] }) {}

  inputs: ReportEnhancementInput[] = [];

  async generateReportEnhancement(input: ReportEnhancementInput) {
    this.inputs.push(input);
    return this.output;
  }
}

describe("ReportService", () => {
  it("builds a deterministic layered report when no LLM enhancement is returned", async () => {
    const llm = new StubLlmService(null);
    const service = new ReportService(llm as never);

    const report = await service.buildReport({
      scanId: "scan-1",
      datasetName: "customers",
      createdAt: "2026-06-03T00:00:00.000Z",
      completedAt: "2026-06-03T00:00:01.000Z",
      overallScore: 78,
      scoreBreakdown,
      profiles,
      findings: [finding()],
      audience: "mixed",
    });

    expect(report).toMatchObject({
      scanId: "scan-1",
      datasetName: "customers",
      status: "completed",
      overallScore: 78,
    });
    expect(report.summary.headline).toBe("This dataset scores 78/100 for AI readiness.");
    expect(report.summary.topRisks).toContain("Potential PII detected");
    expect(report.actionPlan[0]).toMatchObject({
      priority: "P1",
      title: "Potential PII detected",
      affectedArea: "customers.email",
      expectedScoreImpact: 14,
    });
    expect(llm.inputs[0]).toMatchObject({ audience: "mixed", overallScore: 78 });
  });

  it("uses LLM-enhanced summary and action plan when the adapter returns one", async () => {
    const enhancedSummary: ReportSummary = {
      headline: "Enhanced headline",
      businessImpact: "Enhanced business impact",
      topRisks: ["Enhanced risk"],
      nextSteps: ["Enhanced step"],
    };
    const enhancedActionPlan: ActionItem[] = [
      {
        priority: "P1",
        title: "Enhanced action",
        whyItMatters: "Because AI needs reliable context.",
        recommendedFix: "Fix upstream data capture.",
        affectedArea: "customers.email",
        expectedScoreImpact: 14,
      },
    ];
    const service = new ReportService(new StubLlmService({ summary: enhancedSummary, actionPlan: enhancedActionPlan }) as never);

    const report = await service.buildReport({
      scanId: "scan-2",
      datasetName: "customers",
      createdAt: "2026-06-03T00:00:00.000Z",
      completedAt: "2026-06-03T00:00:01.000Z",
      overallScore: 78,
      scoreBreakdown,
      profiles,
      findings: [finding()],
      audience: "executive",
    });

    expect(report.summary).toBe(enhancedSummary);
    expect(report.actionPlan).toBe(enhancedActionPlan);
  });
});
