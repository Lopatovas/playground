import { z } from 'zod';

/**
 * Validation of `report.json` at the dashboard boundary.
 *
 * The dashboard is handed a file produced by a separate process, possibly an older
 * one. Validating on load turns a schema drift into one clear message instead of a
 * blank overlay and a console full of undefined property reads.
 */

const boxSchema = z.object({
  xMin: z.number(),
  yMin: z.number(),
  xMax: z.number(),
  yMax: z.number(),
});

export const defectTypeSchema = z.enum([
  'spacing',
  'position',
  'missing-element',
  'unexpected-element',
  'font-size',
  'font-weight',
  'font-family',
  'color',
]);

export const defectSeveritySchema = z.enum(['error', 'warning', 'info']);

export const defectSchema = z
  .object({
    id: z.string().min(1),
    type: defectTypeSchema,
    severity: defectSeveritySchema,
    message: z.string(),
    designBox: boxSchema.optional(),
    liveBox: boxSchema.optional(),
    designElementId: z.string().optional(),
    liveElementId: z.string().optional(),
  })
  // Type-specific measurement fields are carried through untouched so the details
  // panel can show them without the dashboard re-declaring every defect shape.
  .passthrough();

const surfaceSchema = z.object({
  imagePath: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
  imageSha256: z.string(),
});

const elementSchema = z.object({
  id: z.string(),
  surface: z.enum(['design', 'live']),
  box: boxSchema,
  kind: z.string(),
  label: z.string(),
  text: z.string().optional(),
  confidence: z.number().optional(),
});

export const reportSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1),
  generatedAt: z.string().min(1),
  target: z.object({
    url: z.string(),
    viewport: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
      deviceScaleFactor: z.number().positive(),
    }),
  }),
  surfaces: z.object({ design: surfaceSchema, live: surfaceSchema }),
  tolerances: z.object({
    spacingPx: z.number(),
    positionPx: z.number(),
    fontSizePx: z.number(),
    deltaE: z.number(),
    minFamilyMargin: z.number(),
  }),
  summary: z.object({
    passed: z.boolean(),
    totalDefects: z.number().int().min(0),
    bySeverity: z.record(z.number()),
    byType: z.record(z.number()),
    designElementCount: z.number().int().min(0),
    liveElementCount: z.number().int().min(0),
    matchedElementCount: z.number().int().min(0),
    matchRate: z.number(),
  }),
  defects: z.array(defectSchema),
  measurements: z.object({
    designElements: z.array(elementSchema),
    liveElements: z.array(elementSchema),
    pairs: z.array(
      z.object({
        designElementId: z.string(),
        liveElementId: z.string(),
        centerOffset: z.object({ dx: z.number(), dy: z.number() }),
        centerDistance: z.number(),
        iou: z.number(),
      }),
    ),
    spacing: z.array(z.unknown()),
    typography: z.array(z.unknown()),
    colors: z.array(z.unknown()),
  }),
  diagnostics: z.object({
    warnings: z.array(z.string()),
    detector: z.string(),
    textRecognizer: z.string(),
    durationMs: z.number(),
  }),
});

export type DashboardReport = z.infer<typeof reportSchema>;
export type DashboardDefect = z.infer<typeof defectSchema>;
export type DashboardBox = z.infer<typeof boxSchema>;
export type DefectType = z.infer<typeof defectTypeSchema>;
export type DefectSeverity = z.infer<typeof defectSeveritySchema>;

export interface ReportParseFailure {
  readonly ok: false;
  readonly message: string;
  readonly issues: readonly string[];
}

export interface ReportParseSuccess {
  readonly ok: true;
  readonly report: DashboardReport;
}

export function parseReport(input: unknown): ReportParseSuccess | ReportParseFailure {
  const result = reportSchema.safeParse(input);
  if (result.success) return { ok: true, report: result.data };

  return {
    ok: false,
    message:
      'This report does not match the format this dashboard understands. It may have been ' +
      'produced by a different version of Bulwark.',
    issues: result.error.issues.map(
      (issue) => `${issue.path.length === 0 ? '<root>' : issue.path.join('.')}: ${issue.message}`,
    ),
  };
}
