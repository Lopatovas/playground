export type ScanStatus = "queued" | "processing" | "completed" | "failed";

export type ScoreCategory =
  | "dataQuality"
  | "privacyCompliance"
  | "schemaClarity"
  | "aiUsability"
  | "monitoringReadiness";

export type FindingSeverity = "critical" | "high" | "medium" | "low";

export type FindingCategory =
  | "DATA_QUALITY"
  | "PRIVACY_COMPLIANCE"
  | "SCHEMA_CLARITY"
  | "AI_USABILITY"
  | "MONITORING_READINESS";

export type ReportAudience = "mixed" | "executive" | "technical" | "compliance" | "ai-implementation";

export interface ColumnProfile {
  name: string;
  inferredType: string;
  totalRows: number;
  missingCount: number;
  missingPercent: number;
  uniqueCount: number;
  uniquePercent: number;
  piiTypes: string[];
  samplePatterns: string[];
}

export interface TableProfile {
  name: string;
  rowCount: number;
  columnCount: number;
  duplicateRows: number;
  duplicateRowsPercent: number;
  columns: ColumnProfile[];
}

export interface ScanFinding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  tableName: string;
  columnName?: string;
  affectedRowsPercent?: number;
  evidence: string;
  scoreImpact: number;
  recommendation: string;
  ruleId: string;
}

export interface ScoreBreakdown {
  category: ScoreCategory;
  label: string;
  score: number;
  weight: number;
  rationale: string;
}

export interface ActionItem {
  priority: "P1" | "P2" | "P3";
  title: string;
  whyItMatters: string;
  recommendedFix: string;
  affectedArea: string;
  expectedScoreImpact: number;
}

export interface ReportSummary {
  headline: string;
  businessImpact: string;
  topRisks: string[];
  nextSteps: string[];
}

export interface ColumnDictionaryEntry {
  tableName: string;
  columnName: string;
  suggestedDefinition: string;
  dataNotes: string;
}

export interface RemediationPlaybookItem {
  phase: string;
  owner: string;
  tasks: string[];
}

export interface ScanComparison {
  previousScanId: string;
  currentScanId: string;
  scoreDelta: number;
  categoryDeltas: Array<{
    category: ScoreCategory;
    label: string;
    previousScore: number;
    currentScore: number;
    delta: number;
  }>;
  findingDelta: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  narrative?: string;
  deterministicNarrative?: string;
}

export interface ScanReport {
  scanId: string;
  tenantId: string;
  datasetName: string;
  status: ScanStatus;
  createdAt: string;
  completedAt?: string;
  overallScore: number;
  scoreBreakdown: ScoreBreakdown[];
  summary: ReportSummary;
  actionPlan: ActionItem[];
  profiles: TableProfile[];
  findings: ScanFinding[];
  comparison?: ScanComparison;
  reportAudience?: ReportAudience | string;
  llmEnhanced?: boolean;
  llmProvider?: string;
  deterministicSummary?: ReportSummary;
  deterministicActionPlan?: ActionItem[];
  columnDictionary?: ColumnDictionaryEntry[];
  remediationPlaybook?: RemediationPlaybookItem[];
}

export interface ScanListItem {
  id: string;
  tenantId: string;
  datasetName: string;
  status: ScanStatus;
  createdAt: string;
  completedAt?: string;
  overallScore?: number;
  findingCount?: number;
}

export interface ReportChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ReportChatRequest {
  message: string;
  history?: ReportChatMessage[];
}

export interface ReportChatResponse {
  reply: string;
  refused: boolean;
}
