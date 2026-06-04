import { describe, expect, it } from "vitest";
import type { ScanFinding } from "@ai-readiness/shared";
import { ScoringService } from "../scoring.service.js";

function finding(input: Pick<ScanFinding, "category" | "scoreImpact"> & Partial<ScanFinding>): ScanFinding {
  return {
    id: input.id ?? crypto.randomUUID(),
    category: input.category,
    severity: input.severity ?? "medium",
    title: input.title ?? "Finding",
    description: input.description ?? "Description",
    tableName: input.tableName ?? "table",
    columnName: input.columnName,
    affectedRowsPercent: input.affectedRowsPercent,
    evidence: input.evidence ?? "Evidence",
    scoreImpact: input.scoreImpact,
    recommendation: input.recommendation ?? "Fix it",
    ruleId: input.ruleId ?? "rule.test",
  };
}

describe("ScoringService", () => {
  it("subtracts category penalties and computes the weighted overall readiness score", () => {
    const service = new ScoringService();

    const result = service.score([
      finding({ category: "DATA_QUALITY", scoreImpact: 20 }),
      finding({ category: "PRIVACY_COMPLIANCE", scoreImpact: 40 }),
      finding({ category: "SCHEMA_CLARITY", scoreImpact: 10 }),
      finding({ category: "AI_USABILITY", scoreImpact: 30 }),
      finding({ category: "MONITORING_READINESS", scoreImpact: 50 }),
    ]);

    expect(result.scoreBreakdown).toEqual([
      expect.objectContaining({ category: "dataQuality", score: 80, weight: 0.3 }),
      expect.objectContaining({ category: "privacyCompliance", score: 60, weight: 0.25 }),
      expect.objectContaining({ category: "schemaClarity", score: 90, weight: 0.2 }),
      expect.objectContaining({ category: "aiUsability", score: 70, weight: 0.15 }),
      expect.objectContaining({ category: "monitoringReadiness", score: 50, weight: 0.1 }),
    ]);
    expect(result.overallScore).toBe(73);
  });

  it("clamps heavily penalized category scores at zero", () => {
    const service = new ScoringService();

    const result = service.score([
      finding({ category: "PRIVACY_COMPLIANCE", scoreImpact: 80 }),
      finding({ category: "PRIVACY_COMPLIANCE", scoreImpact: 60 }),
    ]);

    expect(result.scoreBreakdown).toEqual(
      expect.arrayContaining([expect.objectContaining({ category: "privacyCompliance", score: 0 })]),
    );
  });
});
