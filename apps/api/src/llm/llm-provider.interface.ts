import type { ActionItem, ReportSummary, ScanFinding, ScoreBreakdown } from "@ai-readiness/shared";

export interface ReportEnhancementInput {
  audience: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown[];
  findings: ScanFinding[];
  summary: ReportSummary;
  actionPlan: ActionItem[];
}

export interface ReportEnhancementOutput {
  summary?: ReportSummary;
  actionPlan?: ActionItem[];
}

export interface LlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateReportEnhancement(input: ReportEnhancementInput): Promise<ReportEnhancementOutput | null>;
}
