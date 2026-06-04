import type {
  ActionItem,
  ColumnDictionaryEntry,
  RemediationPlaybookItem,
  ReportChatMessage,
  ReportSummary,
  ScanComparison,
  ScanFinding,
  ScoreBreakdown,
  TableProfile,
} from "@ai-readiness/shared";

export interface ReportEnhancementInput {
  audience: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown[];
  findings: ScanFinding[];
  profiles: TableProfile[];
  summary: ReportSummary;
  actionPlan: ActionItem[];
  comparison?: ScanComparison;
  deterministicComparisonNarrative?: string;
}

export interface ReportEnhancementOutput {
  summary?: ReportSummary;
  actionPlan?: ActionItem[];
  comparisonNarrative?: string;
  columnDictionary?: ColumnDictionaryEntry[];
  remediationPlaybook?: RemediationPlaybookItem[];
}

export interface ReportChatInput {
  audience: string;
  reportContext: Record<string, unknown>;
  message: string;
  history: ReportChatMessage[];
}

export interface ReportChatOutput {
  reply: string;
  refused: boolean;
}

export interface LlmProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateReportEnhancement(input: ReportEnhancementInput): Promise<ReportEnhancementOutput | null>;
  chatAboutReport(input: ReportChatInput): Promise<ReportChatOutput | null>;
}
