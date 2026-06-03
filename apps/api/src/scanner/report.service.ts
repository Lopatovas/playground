import { Injectable } from "@nestjs/common";
import type {
  ActionItem,
  ReportSummary,
  ScanComparison,
  ScanFinding,
  ScanReport,
  ScoreBreakdown,
  TableProfile,
} from "@ai-readiness/shared";
import { LlmService } from "../llm/llm.service.js";

@Injectable()
export class ReportService {
  constructor(private readonly llmService: LlmService) {}

  async buildReport(input: {
    scanId: string;
    datasetName: string;
    createdAt: string;
    completedAt: string;
    overallScore: number;
    scoreBreakdown: ScoreBreakdown[];
    profiles: TableProfile[];
    findings: ScanFinding[];
    previousReport?: ScanReport;
    audience: string;
  }): Promise<ScanReport> {
    const comparison = input.previousReport ? this.compareReports(input.previousReport, input) : undefined;
    const deterministicSummary = this.buildSummary(input.overallScore, input.findings, comparison);
    const deterministicActionPlan = this.buildActionPlan(input.findings);
    const llmEnhancement = await this.llmService.generateReportEnhancement({
      audience: input.audience,
      overallScore: input.overallScore,
      scoreBreakdown: input.scoreBreakdown,
      findings: input.findings.slice(0, 12),
      summary: deterministicSummary,
      actionPlan: deterministicActionPlan.slice(0, 8),
    });

    return {
      scanId: input.scanId,
      datasetName: input.datasetName,
      status: "completed",
      createdAt: input.createdAt,
      completedAt: input.completedAt,
      overallScore: input.overallScore,
      scoreBreakdown: input.scoreBreakdown,
      summary: llmEnhancement?.summary ?? deterministicSummary,
      actionPlan: llmEnhancement?.actionPlan ?? deterministicActionPlan,
      profiles: input.profiles,
      findings: input.findings,
      comparison,
    };
  }

  private buildSummary(overallScore: number, findings: ScanFinding[], comparison?: ScanComparison): ReportSummary {
    const criticalAndHigh = findings.filter((finding) => finding.severity === "critical" || finding.severity === "high");
    const topRisks = criticalAndHigh.slice(0, 4).map((finding) => finding.title);
    const trend =
      comparison && comparison.scoreDelta !== 0
        ? ` The readiness score ${comparison.scoreDelta > 0 ? "improved" : "declined"} by ${Math.abs(comparison.scoreDelta)} points since the previous scan.`
        : "";

    return {
      headline: `This dataset scores ${overallScore}/100 for AI readiness.`,
      businessImpact:
        overallScore >= 80
          ? `The dataset appears broadly ready for controlled AI use, with remaining issues suitable for targeted cleanup.${trend}`
          : overallScore >= 60
            ? `The dataset can support AI discovery, but important quality, privacy or structure issues should be addressed before production use.${trend}`
            : `The dataset has material blockers that could cause inaccurate AI answers, compliance exposure or weak trust in AI outputs.${trend}`,
      topRisks: topRisks.length > 0 ? topRisks : ["No critical or high-severity risks were detected."],
      nextSteps: [
        "Resolve P1 action items before connecting this dataset to AI assistants.",
        "Document ambiguous fields in a lightweight data dictionary.",
        "Repeat the scan after cleanup to measure score movement.",
      ],
    };
  }

  private buildActionPlan(findings: ScanFinding[]): ActionItem[] {
    return findings
      .slice()
      .sort((a, b) => severityRank(a.severity) - severityRank(b.severity) || b.scoreImpact - a.scoreImpact)
      .slice(0, 10)
      .map((finding) => ({
        priority: finding.severity === "critical" || finding.severity === "high" ? "P1" : finding.severity === "medium" ? "P2" : "P3",
        title: finding.title,
        whyItMatters: finding.description,
        recommendedFix: finding.recommendation,
        affectedArea: [finding.tableName, finding.columnName].filter(Boolean).join("."),
        expectedScoreImpact: finding.scoreImpact,
      }));
  }

  private compareReports(
    previous: ScanReport,
    current: Pick<ScanReport, "scanId" | "overallScore" | "scoreBreakdown" | "findings">,
  ): ScanComparison {
    return {
      previousScanId: previous.scanId,
      currentScanId: current.scanId,
      scoreDelta: current.overallScore - previous.overallScore,
      categoryDeltas: current.scoreBreakdown.map((score) => {
        const previousScore = previous.scoreBreakdown.find((item) => item.category === score.category);

        return {
          category: score.category,
          label: score.label,
          previousScore: previousScore?.score ?? 0,
          currentScore: score.score,
          delta: score.score - (previousScore?.score ?? 0),
        };
      }),
      findingDelta: {
        critical: countSeverity(current.findings, "critical") - countSeverity(previous.findings, "critical"),
        high: countSeverity(current.findings, "high") - countSeverity(previous.findings, "high"),
        medium: countSeverity(current.findings, "medium") - countSeverity(previous.findings, "medium"),
        low: countSeverity(current.findings, "low") - countSeverity(previous.findings, "low"),
      },
    };
  }
}

function severityRank(severity: ScanFinding["severity"]): number {
  return { critical: 0, high: 1, medium: 2, low: 3 }[severity];
}

function countSeverity(findings: ScanFinding[], severity: ScanFinding["severity"]): number {
  return findings.filter((finding) => finding.severity === severity).length;
}
