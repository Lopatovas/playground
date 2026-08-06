import type { Defect, QaReport } from '@bulwark/domain';

/**
 * Renders a report as terminal output.
 *
 * The summary leads with the verdict and the counts, then lists defects grouped by
 * type. Anyone reading CI output wants to know whether it failed and which elements
 * to look at, in that order.
 */
export function formatReportSummary(report: QaReport, options: { color: boolean }): string {
  const paint = options.color ? colorize : (_code: string, text: string) => text;
  const lines: string[] = [];

  const verdict = report.summary.passed
    ? paint('32', 'PASS')
    : paint('31', 'FAIL');
  lines.push(
    `${verdict} ${report.target.url} against ${report.surfaces.design.imagePath} ` +
      `(run ${report.runId})`,
  );
  lines.push(
    `  ${report.summary.matchedElementCount}/${report.summary.designElementCount} design elements ` +
      `matched, ${report.summary.totalDefects} defect(s) in ${report.diagnostics.durationMs}ms`,
  );

  const bySeverity = Object.entries(report.summary.bySeverity)
    .map(([severity, count]) => `${count} ${severity}`)
    .join(', ');
  if (bySeverity.length > 0) lines.push(`  severity: ${bySeverity}`);

  for (const defect of report.defects) {
    const marker = defect.severity === 'error' ? paint('31', '✗') : paint('33', '!');
    lines.push(`  ${marker} [${defect.type}] ${defect.message}`);
  }

  for (const warning of report.diagnostics.warnings) {
    lines.push(`  ${paint('90', '·')} ${warning}`);
  }

  return lines.join('\n');
}

/** One line per defect, in a format editors and CI annotations can parse. */
export function formatDefectsAsLines(defects: readonly Defect[]): string {
  return defects
    .map((defect) => `${defect.severity}\t${defect.type}\t${defect.id}\t${defect.message}`)
    .join('\n');
}

function colorize(code: string, text: string): string {
  return `\u001B[${code}m${text}\u001B[0m`;
}
