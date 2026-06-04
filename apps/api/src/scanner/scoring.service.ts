import { Injectable } from "@nestjs/common";
import type { FindingCategory, ScanFinding, ScoreBreakdown, ScoreCategory } from "@ai-readiness/shared";

const scoreDefinitions: Array<{
  category: ScoreCategory;
  findingCategory: FindingCategory;
  label: string;
  weight: number;
}> = [
  {
    category: "dataQuality",
    findingCategory: "DATA_QUALITY",
    label: "Data Quality",
    weight: 0.3,
  },
  {
    category: "privacyCompliance",
    findingCategory: "PRIVACY_COMPLIANCE",
    label: "Privacy & Compliance",
    weight: 0.25,
  },
  {
    category: "schemaClarity",
    findingCategory: "SCHEMA_CLARITY",
    label: "Schema Clarity",
    weight: 0.2,
  },
  {
    category: "aiUsability",
    findingCategory: "AI_USABILITY",
    label: "AI Usability",
    weight: 0.15,
  },
  {
    category: "monitoringReadiness",
    findingCategory: "MONITORING_READINESS",
    label: "Monitoring Readiness",
    weight: 0.1,
  },
];

@Injectable()
export class ScoringService {
  score(findings: ScanFinding[]): { overallScore: number; scoreBreakdown: ScoreBreakdown[] } {
    const scoreBreakdown = scoreDefinitions.map((definition) => {
      const categoryFindings = findings.filter((finding) => finding.category === definition.findingCategory);
      const penalty = categoryFindings.reduce((total, finding) => total + finding.scoreImpact, 0);
      const score = clampScore(100 - penalty);

      return {
        category: definition.category,
        label: definition.label,
        score,
        weight: definition.weight,
        rationale: this.rationale(definition.label, categoryFindings.length, penalty),
      };
    });

    const overallScore = Math.round(
      scoreBreakdown.reduce((total, item) => total + item.score * item.weight, 0),
    );

    return { overallScore, scoreBreakdown };
  }

  private rationale(label: string, findingCount: number, penalty: number): string {
    if (findingCount === 0) {
      return `${label} has no detected blockers in this scan.`;
    }

    return `${label} was reduced by ${penalty} points from ${findingCount} finding${findingCount === 1 ? "" : "s"}.`;
  }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
