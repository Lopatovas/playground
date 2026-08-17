import { z } from 'zod';
import { canonicalStringify } from '@bulwark/domain';
import { ContractViolationError } from '@bulwark/ports';
import type { LiveCapture } from '@bulwark/ports';
import { DESIGN_ARTIFACT_PATH, LIVE_ARTIFACT_PATH, REPORT_ARTIFACT_PATH } from '@bulwark/pipeline';
import type { CliContext } from './context.js';
import { prepareRun } from './context.js';
import { formatDefectsAsLines, formatReportSummary } from '../reporting/format-report.js';
import { EXIT_DEFECTS_FOUND, EXIT_OK } from './run.js';

const boxSchema = z.object({
  xMin: z.number(),
  yMin: z.number(),
  xMax: z.number(),
  yMax: z.number(),
});

const domElementSchema = z.object({
  id: z.string().min(1),
  tagName: z.string().min(1),
  box: boxSchema,
  text: z.string().nullable(),
  style: z.object({
    fontFamily: z.string(),
    fontSizePx: z.number(),
    fontWeight: z.number(),
    lineHeightPx: z.number().nullable(),
    letterSpacingPx: z.number().nullable(),
    color: z.string(),
    backgroundColor: z.string(),
    borderRadiusPx: z.number().nullable(),
    opacity: z.number(),
  }),
  hasTransparentBackground: z.boolean(),
  depth: z.number().int().min(0),
});

/** Shape of the `live-dom.json` artifact the capture command writes. */
export const liveDomArtifactSchema = z.object({
  url: z.string(),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    deviceScaleFactor: z.number().positive(),
  }),
  engine: z.string(),
  imageWidth: z.number().int().positive(),
  imageHeight: z.number().int().positive(),
  elements: z.array(domElementSchema),
});

export interface AnalyzeCommandOptions {
  readonly configPath: string;
  /** Design export; defaults to the configured path. */
  readonly designImage?: string;
  /** Live screenshot from a previous capture. */
  readonly liveImage: string;
  /** DOM snapshot from the same capture. */
  readonly liveDom: string;
  readonly format: 'pretty' | 'json' | 'lines';
  readonly color: boolean;
  readonly failOnDefects?: boolean;
}

/**
 * Analyses a previously captured pair of artifacts.
 *
 * Re-analysing stored artifacts is how a tolerance change or a fix to the measurement
 * math can be evaluated against a known regression, without re-rendering the page and
 * introducing a second variable.
 */
export async function analyzeCommand(
  context: CliContext,
  options: AnalyzeCommandOptions,
): Promise<number> {
  const prepared = await prepareRun(context, options.configPath);

  const designImage = await context.readBinaryFile(
    options.designImage ?? prepared.loaded.designImagePath,
  );
  const screenshot = await context.readBinaryFile(options.liveImage);
  const domRaw = await context.readBinaryFile(options.liveDom);

  const parsed = liveDomArtifactSchema.safeParse(
    JSON.parse(Buffer.from(domRaw).toString('utf8')) as unknown,
  );
  if (!parsed.success) {
    throw new ContractViolationError(
      'live-dom.json',
      `the DOM snapshot at "${options.liveDom}" does not match the expected shape`,
      {
        issues: parsed.error.issues.map(
          (issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`,
        ),
      },
    );
  }

  const live: LiveCapture = {
    screenshot,
    elements: parsed.data.elements,
    viewport: parsed.data.viewport,
    imageWidth: parsed.data.imageWidth,
    imageHeight: parsed.data.imageHeight,
    url: parsed.data.url,
    engine: parsed.data.engine,
  };

  const report = await prepared.engine.analyze({
    designImage,
    live,
    designImagePath: DESIGN_ARTIFACT_PATH,
    liveImagePath: LIVE_ARTIFACT_PATH,
  });

  await prepared.store.write(DESIGN_ARTIFACT_PATH, designImage);
  await prepared.store.write(LIVE_ARTIFACT_PATH, screenshot);
  const reportPath = await prepared.store.writeText(
    REPORT_ARTIFACT_PATH,
    canonicalStringify(report),
  );

  switch (options.format) {
    case 'json':
      context.stdout(canonicalStringify(report).trimEnd());
      break;
    case 'lines':
      if (report.defects.length > 0) context.stdout(formatDefectsAsLines(report.defects));
      break;
    default:
      context.stdout(formatReportSummary(report, { color: options.color }));
      context.stdout(`  report: ${reportPath}`);
  }

  const failOnDefects = options.failOnDefects ?? prepared.loaded.config.output.failOnDefects;
  return failOnDefects && !report.summary.passed ? EXIT_DEFECTS_FOUND : EXIT_OK;
}
