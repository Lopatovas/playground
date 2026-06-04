import { Injectable } from "@nestjs/common";
import type { FindingCategory, FindingSeverity, ScanFinding, TableProfile } from "@ai-readiness/shared";
import { randomUUID } from "node:crypto";

@Injectable()
export class RiskDetectorService {
  detectFindings(profiles: TableProfile[]): ScanFinding[] {
    return profiles.flatMap((profile) => [
      ...this.detectTableFindings(profile),
      ...profile.columns.flatMap((column) => this.detectColumnFindings(profile, column)),
    ]);
  }

  private detectTableFindings(profile: TableProfile): ScanFinding[] {
    const findings: ScanFinding[] = [];

    if (profile.rowCount === 0) {
      findings.push(
        finding({
          category: "DATA_QUALITY",
          severity: "critical",
          title: "Uploaded table has no data rows",
          description: "AI systems cannot be evaluated or grounded on an empty dataset.",
          tableName: profile.name,
          affectedRowsPercent: 100,
          evidence: "The parser found zero data rows after header extraction.",
          scoreImpact: 35,
          recommendation: "Export the source data again and confirm that the table contains representative production-like rows.",
          ruleId: "table.empty",
        }),
      );
    }

    if (profile.duplicateRowsPercent >= 10) {
      findings.push(
        finding({
          category: "DATA_QUALITY",
          severity: "high",
          title: "High duplicate row rate",
          description: "Duplicate rows can skew summaries, trend analysis and AI-generated business explanations.",
          tableName: profile.name,
          affectedRowsPercent: profile.duplicateRowsPercent,
          evidence: `${profile.duplicateRows} duplicate rows detected (${profile.duplicateRowsPercent}%).`,
          scoreImpact: 16,
          recommendation: "Deduplicate records using stable business keys before connecting this dataset to AI analytics workflows.",
          ruleId: "table.duplicates.high",
        }),
      );
    } else if (profile.duplicateRowsPercent >= 2) {
      findings.push(
        finding({
          category: "DATA_QUALITY",
          severity: "medium",
          title: "Duplicate rows detected",
          description: "Some duplicate records are present and may reduce trust in AI-produced summaries.",
          tableName: profile.name,
          affectedRowsPercent: profile.duplicateRowsPercent,
          evidence: `${profile.duplicateRows} duplicate rows detected (${profile.duplicateRowsPercent}%).`,
          scoreImpact: 8,
          recommendation: "Review duplicate generation paths and apply deduplication during data preparation.",
          ruleId: "table.duplicates.medium",
        }),
      );
    }

    const hasLikelyStableId = profile.columns.some(
      (column) =>
        /(^id$|_id$|customer|user|player|account)/i.test(column.name) &&
        column.uniquePercent >= 60 &&
        column.missingPercent < 5,
    );

    if (!hasLikelyStableId && profile.rowCount > 0) {
      findings.push(
        finding({
          category: "MONITORING_READINESS",
          severity: "medium",
          title: "No obvious stable identifier",
          description: "Recurring monitoring and scan-to-scan comparisons are harder without a reliable record identifier.",
          tableName: profile.name,
          evidence: "No column looked like a mostly complete customer/user/player/account identifier.",
          scoreImpact: 10,
          recommendation: "Add or expose a stable business key so future scans can compare record-level changes safely.",
          ruleId: "monitoring.stable_id.missing",
        }),
      );
    }

    const hasTimeColumn = profile.columns.some((column) => /date|time|created|updated|timestamp/i.test(column.name));

    if (!hasTimeColumn && profile.rowCount > 0) {
      findings.push(
        finding({
          category: "MONITORING_READINESS",
          severity: "low",
          title: "No obvious timestamp column",
          description: "AI monitoring benefits from time context so drift and regressions can be traced to specific periods.",
          tableName: profile.name,
          evidence: "No column name indicated created, updated, event time or timestamp semantics.",
          scoreImpact: 5,
          recommendation: "Include source timestamps in exports used for recurring AI readiness monitoring.",
          ruleId: "monitoring.timestamp.missing",
        }),
      );
    }

    return findings;
  }

  private detectColumnFindings(profile: TableProfile, column: TableProfile["columns"][number]): ScanFinding[] {
    const findings: ScanFinding[] = [];

    if (column.missingPercent >= 50) {
      findings.push(
        finding({
          category: "DATA_QUALITY",
          severity: "high",
          title: "Column is mostly missing",
          description: "A mostly empty field is weak context for AI systems and can produce unreliable analysis.",
          tableName: profile.name,
          columnName: column.name,
          affectedRowsPercent: column.missingPercent,
          evidence: `${column.missingPercent}% of rows are missing a value.`,
          scoreImpact: 14,
          recommendation: "Decide whether this field is required, can be removed, or needs upstream data capture fixes.",
          ruleId: "column.missing.high",
        }),
      );
    } else if (column.missingPercent >= 15) {
      findings.push(
        finding({
          category: "DATA_QUALITY",
          severity: "medium",
          title: "Column has material missing values",
          description: "Missing values reduce AI confidence and can lead to misleading summaries or incomplete segmentation.",
          tableName: profile.name,
          columnName: column.name,
          affectedRowsPercent: column.missingPercent,
          evidence: `${column.missingPercent}% of rows are missing a value.`,
          scoreImpact: 8,
          recommendation: "Backfill where possible, document expected null behavior, or exclude this field from AI use cases.",
          ruleId: "column.missing.medium",
        }),
      );
    }

    if (column.piiTypes.length > 0) {
      const criticalTypes = new Set(["government_id", "date_of_birth"]);
      const severity: FindingSeverity = column.piiTypes.some((type) => criticalTypes.has(type)) ? "critical" : "high";

      findings.push(
        finding({
          category: "PRIVACY_COMPLIANCE",
          severity,
          title: "Potential PII detected",
          description: "Personal data requires explicit handling rules before it is exposed to AI assistants or analytics agents.",
          tableName: profile.name,
          columnName: column.name,
          affectedRowsPercent: 100 - column.missingPercent,
          evidence: `Detected PII signals: ${column.piiTypes.join(", ")}.`,
          scoreImpact: severity === "critical" ? 22 : 14,
          recommendation: "Classify the field, define lawful processing basis, and mask or exclude it from AI prompts unless required.",
          ruleId: "privacy.pii.detected",
        }),
      );
    }

    if (isAmbiguousColumnName(column.name)) {
      findings.push(
        finding({
          category: "SCHEMA_CLARITY",
          severity: "medium",
          title: "Ambiguous column name",
          description: "AI tools perform better when column names clearly encode business meaning.",
          tableName: profile.name,
          columnName: column.name,
          evidence: `Column name "${column.name}" is generic, abbreviated, or likely system-generated.`,
          scoreImpact: 8,
          recommendation: "Rename the column or add a data dictionary entry that explains its business meaning.",
          ruleId: "schema.column_name.ambiguous",
        }),
      );
    }

    if (column.inferredType === "string" && column.uniquePercent > 90 && column.missingPercent < 5 && column.samplePatterns.length === 0) {
      findings.push(
        finding({
          category: "AI_USABILITY",
          severity: "low",
          title: "High-cardinality text field needs semantic context",
          description: "High-cardinality free text or opaque identifiers can be hard for AI systems to interpret without metadata.",
          tableName: profile.name,
          columnName: column.name,
          evidence: `${column.uniquePercent}% of rows contain unique values.`,
          scoreImpact: 5,
          recommendation: "Document whether this field is an identifier, label, note, code, or natural-language content.",
          ruleId: "ai.high_cardinality_text.context",
        }),
      );
    }

    if (column.inferredType === "empty") {
      findings.push(
        finding({
          category: "SCHEMA_CLARITY",
          severity: "medium",
          title: "Empty column",
          description: "Empty fields add noise and may confuse automated schema interpretation.",
          tableName: profile.name,
          columnName: column.name,
          affectedRowsPercent: 100,
          evidence: "No non-empty values were detected.",
          scoreImpact: 7,
          recommendation: "Remove the column from AI-bound exports or populate it with meaningful values.",
          ruleId: "schema.column.empty",
        }),
      );
    }

    return findings;
  }
}

function finding(input: Omit<ScanFinding, "id">): ScanFinding {
  return {
    id: randomUUID(),
    ...input,
  };
}

function isAmbiguousColumnName(name: string): boolean {
  const normalized = name.toLowerCase().trim();

  return (
    normalized.length <= 2 ||
    /^col_?\d+$/.test(normalized) ||
    /^field_?\d+$/.test(normalized) ||
    ["misc", "other", "flag", "value", "data", "old", "new", "tmp", "temp", "status_old"].includes(normalized)
  );
}
