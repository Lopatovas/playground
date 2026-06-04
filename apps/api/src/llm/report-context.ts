import type { ScanReport } from "@ai-readiness/shared";

/** Aggregate scan metadata safe to send to an LLM (no raw row values). */
export function buildReportContextPayload(report: ScanReport) {
  return {
    scanId: report.scanId,
    tenantId: report.tenantId,
    datasetName: report.datasetName,
    reportAudience: report.reportAudience,
    overallScore: report.overallScore,
    scoreBreakdown: report.scoreBreakdown,
    summary: report.summary,
    actionPlan: report.actionPlan.slice(0, 8),
    findings: report.findings.map((finding) => ({
      category: finding.category,
      severity: finding.severity,
      title: finding.title,
      description: finding.description,
      tableName: finding.tableName,
      columnName: finding.columnName,
      evidence: finding.evidence,
      scoreImpact: finding.scoreImpact,
      recommendation: finding.recommendation,
      ruleId: finding.ruleId,
    })),
    profiles: report.profiles.map((profile) => ({
      name: profile.name,
      rowCount: profile.rowCount,
      columnCount: profile.columnCount,
      duplicateRowsPercent: profile.duplicateRowsPercent,
      columns: profile.columns.map((column) => ({
        name: column.name,
        inferredType: column.inferredType,
        missingPercent: column.missingPercent,
        uniquePercent: column.uniquePercent,
        piiTypes: column.piiTypes,
        samplePatterns: column.samplePatterns,
      })),
    })),
    comparison: report.comparison,
    columnDictionary: report.columnDictionary,
    remediationPlaybook: report.remediationPlaybook,
  };
}
