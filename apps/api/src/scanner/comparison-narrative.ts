import type { ScanComparison } from "@ai-readiness/shared";

export function buildDeterministicComparisonNarrative(comparison: ScanComparison): string {
  const direction = comparison.scoreDelta > 0 ? "improved" : comparison.scoreDelta < 0 ? "declined" : "unchanged";
  const magnitude = Math.abs(comparison.scoreDelta);
  const improvedCategories = comparison.categoryDeltas.filter((delta) => delta.delta > 0).map((delta) => delta.label);
  const declinedCategories = comparison.categoryDeltas.filter((delta) => delta.delta < 0).map((delta) => delta.label);
  const findingParts: string[] = [];

  if (comparison.findingDelta.critical !== 0) {
    findingParts.push(`${formatSigned(comparison.findingDelta.critical)} critical`);
  }
  if (comparison.findingDelta.high !== 0) {
    findingParts.push(`${formatSigned(comparison.findingDelta.high)} high`);
  }
  if (comparison.findingDelta.medium !== 0) {
    findingParts.push(`${formatSigned(comparison.findingDelta.medium)} medium`);
  }
  if (comparison.findingDelta.low !== 0) {
    findingParts.push(`${formatSigned(comparison.findingDelta.low)} low`);
  }

  const categoryText = [
    improvedCategories.length > 0 ? `Strongest gains: ${improvedCategories.join(", ")}.` : "",
    declinedCategories.length > 0 ? `Regressions: ${declinedCategories.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const findingText =
    findingParts.length > 0
      ? `Finding counts changed by ${findingParts.join(", ")} severity findings versus the previous scan.`
      : "Finding counts by severity are unchanged versus the previous scan.";

  return `Overall readiness ${direction} by ${magnitude} points compared with the previous scan for this dataset. ${categoryText} ${findingText}`.trim();
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
