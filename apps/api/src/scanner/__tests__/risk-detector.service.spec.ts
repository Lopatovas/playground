import { describe, expect, it } from "vitest";
import type { TableProfile } from "@ai-readiness/shared";
import { RiskDetectorService } from "../risk-detector.service.js";

function baseProfile(overrides: Partial<TableProfile> = {}): TableProfile {
  return {
    name: "players",
    rowCount: 100,
    columnCount: 4,
    duplicateRows: 12,
    duplicateRowsPercent: 12,
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
      {
        name: "status_old",
        inferredType: "string",
        totalRows: 100,
        missingCount: 0,
        missingPercent: 0,
        uniqueCount: 2,
        uniquePercent: 2,
        piiTypes: [],
        samplePatterns: [],
      },
      {
        name: "notes",
        inferredType: "string",
        totalRows: 100,
        missingCount: 70,
        missingPercent: 70,
        uniqueCount: 20,
        uniquePercent: 20,
        piiTypes: [],
        samplePatterns: ["long_text"],
      },
    ],
    ...overrides,
  };
}

describe("RiskDetectorService", () => {
  it("creates deterministic findings for duplicate rows, PII, missingness and ambiguous schema", () => {
    const service = new RiskDetectorService();
    const findings = service.detectFindings([baseProfile()]);

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "DATA_QUALITY",
          severity: "high",
          title: "High duplicate row rate",
          ruleId: "table.duplicates.high",
          scoreImpact: 16,
        }),
        expect.objectContaining({
          category: "PRIVACY_COMPLIANCE",
          severity: "high",
          columnName: "email",
          ruleId: "privacy.pii.detected",
          scoreImpact: 14,
        }),
        expect.objectContaining({
          category: "SCHEMA_CLARITY",
          severity: "medium",
          columnName: "status_old",
          ruleId: "schema.column_name.ambiguous",
        }),
        expect.objectContaining({
          category: "DATA_QUALITY",
          severity: "high",
          columnName: "notes",
          ruleId: "column.missing.high",
        }),
      ]),
    );
  });

  it("marks government identifiers as critical privacy findings", () => {
    const service = new RiskDetectorService();
    const findings = service.detectFindings([
      baseProfile({
        duplicateRows: 0,
        duplicateRowsPercent: 0,
        columns: [
          {
            name: "national_id",
            inferredType: "string",
            totalRows: 10,
            missingCount: 0,
            missingPercent: 0,
            uniqueCount: 10,
            uniquePercent: 100,
            piiTypes: ["government_id"],
            samplePatterns: [],
          },
        ],
      }),
    ]);

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "PRIVACY_COMPLIANCE",
          severity: "critical",
          columnName: "national_id",
          scoreImpact: 22,
        }),
      ]),
    );
  });
});
