import type { ReportAudience } from "@ai-readiness/shared";

const audienceInstructions: Record<ReportAudience, string> = {
  executive:
    "Write for a C-suite or GM reader. Use short sentences, business outcomes, risk exposure, and go/no-go tone. Avoid SQL, rule IDs, or implementation jargon.",
  technical:
    "Write for data engineers and analytics leads. Mention columns, profiling signals, remediation mechanics, and observability. You may use precise technical terms but not raw cell values.",
  compliance:
    "Write for legal/privacy reviewers. Emphasize lawful basis, PII exposure, retention, masking, and auditability. Use cautious regulatory language without inventing laws.",
  "ai-implementation":
    "Write for ML/AI platform teams. Focus on feature readiness, grounding risk, monitoring hooks, and what must be fixed before RAG/agents consume the dataset.",
  mixed:
    "Write for a cross-functional workshop: plain language, one technical detail per point, balanced across business, privacy, and engineering.",
};

export function audienceInstruction(audience: string): string {
  const key = audience as ReportAudience;
  return audienceInstructions[key] ?? audienceInstructions.mixed;
}
