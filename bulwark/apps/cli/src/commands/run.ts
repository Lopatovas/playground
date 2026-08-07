import { canonicalStringify } from '@bulwark/domain';
import type { CliContext } from './context.js';
import { prepareRun } from './context.js';
import { formatDefectsAsLines, formatReportSummary } from '../reporting/format-report.js';

export interface RunCommandOptions {
  readonly configPath: string;
  /** `pretty` for humans, `json` for the full report, `lines` for CI annotations. */
  readonly format: 'pretty' | 'json' | 'lines';
  readonly color: boolean;
  /** Overrides `output.failOnDefects` for a single invocation. */
  readonly failOnDefects?: boolean;
}

export const EXIT_OK = 0;
export const EXIT_DEFECTS_FOUND = 1;

/**
 * Captures the live page, compares it with the design and writes the run artifacts.
 *
 * Returns an exit code rather than calling `process.exit`, so the behaviour that CI
 * depends on is directly testable.
 */
export async function runCommand(context: CliContext, options: RunCommandOptions): Promise<number> {
  const prepared = await prepareRun(context, options.configPath);
  const result = await prepared.runner.run();

  switch (options.format) {
    case 'json':
      context.stdout(canonicalStringify(result.report).trimEnd());
      break;
    case 'lines':
      if (result.report.defects.length > 0) {
        context.stdout(formatDefectsAsLines(result.report.defects));
      }
      break;
    default:
      context.stdout(formatReportSummary(result.report, { color: options.color }));
      context.stdout(`  report: ${result.reportPath}`);
      context.stdout(`  open the overlay with: bulwark serve --run ${prepared.runDirectory}`);
  }

  const failOnDefects = options.failOnDefects ?? prepared.loaded.config.output.failOnDefects;
  return failOnDefects && !result.report.summary.passed ? EXIT_DEFECTS_FOUND : EXIT_OK;
}
