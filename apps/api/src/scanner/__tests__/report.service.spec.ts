import { describe, expect, it } from "vitest";
import type { ActionItem, ReportSummary, ScanFinding, ScoreBreakdown, TableProfile } from "@ai-readiness/shared";
import { ReportService } from "../report.service.js";
import type { ReportEnhancementInput, ReportEnhancementOutput } from "../../llm/llm-provider.interface.js";

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
  constructor(private readonly output: ReportEnhancementOutput | null) {}

  inputs: ReportEnhancementInput[] = [];
  readonly providerName = "stub";

  async generateReportEnhancement(input: ReportEnhancementInput) {
    this.inputs.push(input);
    return this.output;
  }

  async chatAboutReport() {
    return null;
  }
}

describe("ReportService", () => {
  it("builds a deterministic layered report when no LLM enhancement is returned", async () => {
    const llm = new StubLlmService(null);
    const service = new ReportService(llm as never);

    const report = await service.buildReport({
      scanId: "scan-1",
      tenantId: "tenant-a",
      datasetName: "customers",
      createdAt: "2026-06-03T00:00:00.000Z",
      completedAt: "2026-06-03T00:00:01.000Z",
      overallScore: 78,
      scoreBreakdown,
      profiles,
      findings: [finding()],
      audience: "mixed",
    });

    expect(report.summary.headline).toBe("This dataset scores 78/100 for AI readiness.");
    expect(report.deterministicSummary?.headline).toBe("This dataset scores 78/100 for AI readiness.");
    expect(report.llmEnhanced).toBe(false);
    expect(report.actionPlan[0]).toMatchObject({
      priority: "P1",
      title: "Potential PII detected",
    });
    expect(llm.inputs[0]).toMatchObject({ audience: "mixed", overallScore: 78 });
  });

  it("uses LLM-enhanced layers and keeps deterministic copies", async () => {
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
    const service = new ReportService(
      new StubLlmService({
        summary: enhancedSummary,
        actionPlan: enhancedActionPlan,
        comparisonNarrative: "Enhanced comparison story",
        columnDictionary: [
          {
            tableName: "customers",
            columnName: "email",
            suggestedDefinition: "Masked contact handle",
            dataNotes: "PII flagged",
          },
        ],
        remediationPlaybook: [{ phase: "Week 1", owner: "Data engineering", tasks: ["Mask email"] }],
      }) as never,
    );

    const previous = await service.buildReport({
      scanId: "scan-prev",
      tenantId: "tenant-a",
      datasetName: "customers",
      createdAt: "2026-06-01T00:00:00.000Z",
      completedAt: "2026-06-01T00:00:01.000Z",
      overallScore: 60,
      scoreBreakdown,
      profiles,
      findings: [finding(), finding({ id: "finding-2", severity: "medium", title: "Missing values", scoreImpact: 6 })],
      audience: "executive",
    });

    const report = await service.buildReport({
      scanId: "scan-2",
      tenantId: "tenant-a",
      datasetName: "customers",
      createdAt: "2026-06-03T00:00:00.000Z",
      completedAt: "2026-06-03T00:00:01.000Z",
      overallScore: 78,
      scoreBreakdown,
      profiles,
      findings: [finding()],
      previousReport: previous,
      audience: "executive",
    });

    expect(report.summary).toEqual(enhancedSummary);
    expect(report.llmEnhanced).toBe(true);
    expect(report.llmProvider).toBe("stub");
    expect(report.deterministicSummary?.headline).toContain("78/100");
    expect(report.comparison?.narrative).toBe("Enhanced comparison story");
    expect(report.comparison?.deterministicNarrative).toContain("improved");
    expect(report.columnDictionary).toHaveLength(1);
    expect(report.remediationPlaybook).toHaveLength(1);
  });
});
