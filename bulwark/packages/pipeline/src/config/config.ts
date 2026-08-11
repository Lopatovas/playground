import { z } from 'zod';
import { ConfigurationError } from '@bulwark/ports';

/**
 * Project configuration.
 *
 * Every threshold the engine applies is declared here rather than hidden in the
 * analysis code, because a tolerance is a project decision: 2px of drift is a defect
 * in a marketing page and noise in a data grid.
 */

const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'must be a hex color such as #ffffff');

export const viewportSchema = z.object({
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(20_000),
  deviceScaleFactor: z.number().positive().max(4).default(1),
});

export const targetSchema = z.object({
  url: z.string().url(),
  viewport: viewportSchema,
  fullPage: z.boolean().default(false),
  waitForSelector: z.string().min(1).optional(),
  settleMs: z.number().int().min(0).max(60_000).default(250),
  stabilize: z.boolean().default(true),
});

export const designSchema = z.object({
  /** Path to the exported design frame, relative to the config file. */
  imagePath: z.string().min(1),
  /**
   * Export density relative to the live viewport. A 2x Figma export needs 2 so ink
   * measurements convert back to CSS pixels.
   */
  pixelRatio: z.number().positive().max(4).default(1),
  /** Background composited under transparent design pixels. */
  flattenBackground: hexColor.default('#ffffff'),
});

export const tolerancesSchema = z.object({
  spacingPx: z.number().min(0).max(100).default(2),
  positionPx: z.number().min(0).max(100).default(2),
  fontSizePx: z.number().min(0).max(20).default(1),
  deltaE: z.number().min(0).max(100).default(4),
  minFamilyMargin: z.number().min(0).max(1).default(0.02),
});

export const matchingSchema = z.object({
  maxCenterDistancePx: z.number().positive().max(1000).default(48),
  minIou: z.number().min(0).max(1).default(0),
  requireSameKind: z.boolean().default(true),
  labelMismatchPenalty: z.number().min(0).max(10).default(0.35),
});

export const spacingSchema = z.object({
  minCrossAxisOverlapRatio: z.number().min(0).max(1).default(0.5),
  maxGapPx: z.number().positive().max(5000).default(400),
});

export const checksSchema = z.object({
  spacing: z.boolean().default(true),
  position: z.boolean().default(true),
  fontSize: z.boolean().default(true),
  fontWeight: z.boolean().default(true),
  fontFamily: z.boolean().default(true),
  color: z.boolean().default(true),
  reportUnexpectedElements: z.boolean().default(true),
});

export const fontProfileSchema = z.object({
  family: z.string().min(1),
  aliases: z.array(z.string().min(1)).default([]),
  visualToCssRatio: z.number().positive().max(2),
  weightBands: z
    .array(
      z.object({
        weight: z.number().int().min(1).max(1000),
        minStrokeDensity: z.number().min(0).max(1),
        maxStrokeDensity: z.number().min(0).max(1),
      }),
    )
    .min(1),
});

export const typographySchema = z.object({
  /** Families the reference renderer will try when identifying a typeface. */
  candidateFamilies: z.array(z.string().min(1)).default(['Mark Pro', 'Open Sans']),
  heightMeasurement: z.enum(['median-character', 'line-extent']).default('median-character'),
  /** Overrides the built-in Mark Pro and Open Sans profiles when provided. */
  profiles: z.array(fontProfileSchema).optional(),
});

export const colorSchema = z.object({
  clusterCount: z.number().int().min(2).max(8).default(4),
  minForegroundShare: z.number().min(0).max(1).default(0.01),
  minForegroundDeltaE: z.number().min(0).max(100).default(5),
  checkForeground: z.boolean().default(true),
  /**
   * `raster` samples the live screenshot crop like the design PNG (visual compare).
   * `css` reads computed styles (legacy).
   */
  liveSource: z.enum(['raster', 'css']).default('raster'),
  /**
   * `specialized` routes solid controls through fill clustering and text through
   * ink-masked font color. `cluster` applies k-means roles to every matched pair.
   */
  mode: z.enum(['specialized', 'cluster']).default('specialized'),
  /** Dominant-cluster share required before a fill check runs. */
  minSolidShare: z.number().min(0).max(1).default(0.45),
  /**
   * Solid Image / SolidFill crops at/above this share use fill; mid-solidity Images
   * between {@link minPaletteShare} and this use the chart palette path.
   */
  minSolidImageShare: z.number().min(0).max(1).default(0.72),
  /** Image crops at/above this share (but below solid) run multi-stop palette compare. */
  minPaletteShare: z.number().min(0).max(1).default(0.18),
  /** Minimum ink pixels before an ink-masked foreground is trusted. */
  minInkPixels: z.number().int().min(1).default(8),
  /**
   * ΔE for chromatic ink (links, accents). Soft planted accents often sit ~ΔE 6–9.
   */
  inkDeltaE: z.number().min(0).max(100).default(5),
  /** ΔE for near-neutral body text — higher to suppress gray AA false positives. */
  inkNeutralDeltaE: z.number().min(0).max(100).default(13),
  /** Lab chroma C* at/above which ink uses `inkDeltaE` instead of `inkNeutralDeltaE`. */
  inkAccentChroma: z.number().min(0).max(200).default(20),
  /** ΔE for matched chart series stops (pie slices, donut arcs). */
  seriesDeltaE: z.number().min(0).max(100).default(8),
  /** Max design↔live paper ΔE before an ink pair is skipped as unstable. */
  maxInkBackgroundDeltaE: z.number().min(0).max(100).default(18),
  /** Max relative ink-share mismatch before skipping an ink pair. */
  maxInkShareMismatch: z.number().min(0).max(1).default(0.55),
  /**
   * After ScreenParser, propose flat color regions (KPI tiles, swatches, chips)
   * that the detector never boxed. Safe for pie charts: low-purity blobs are dropped.
   */
  solidRegionProposal: z.boolean().default(true),
});

const detectorEndpointSchema = z.object({
  baseUrl: z.string().url(),
  minConfidence: z.number().min(0).max(1).optional(),
  maxOverlap: z.number().min(0).max(1).optional(),
  timeoutMs: z.number().int().positive().default(120_000),
});

export const detectorServiceSchema = z.discriminatedUnion('kind', [
  detectorEndpointSchema.extend({ kind: z.literal('omniparser') }),
  detectorEndpointSchema.extend({ kind: z.literal('screenparser') }),
]);

export const recognizerServiceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('paddleocr'),
    baseUrl: z.string().url(),
    minConfidence: z.number().min(0).max(1).optional(),
    timeoutMs: z.number().int().positive().default(60_000),
  }),
  z.object({
    /** Measures tight glyph boxes locally, with no OCR service. */
    kind: z.literal('ink-projection'),
  }),
]);

export const rasterizerServiceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('playwright') }),
  /** Skips the font-family check instead of guessing without reference renders. */
  z.object({ kind: z.literal('disabled') }),
]);

export const servicesSchema = z.object({
  detector: detectorServiceSchema,
  recognizer: recognizerServiceSchema.default({ kind: 'ink-projection' }),
  rasterizer: rasterizerServiceSchema.default({ kind: 'disabled' }),
  /** Directory for replay caching of service responses; disabled when omitted. */
  cacheDir: z.string().min(1).optional(),
});

export const outputSchema = z.object({
  artifactsDir: z.string().min(1).default('.artifacts'),
  /** Fixed run id, for reproducible artifact paths in tests and CI. */
  runId: z.string().min(1).optional(),
  /** Fail the process when any error-severity defect is found. */
  failOnDefects: z.boolean().default(true),
});

export const bulwarkConfigSchema = z.object({
  $schema: z.string().optional(),
  name: z.string().min(1).default('bulwark'),
  target: targetSchema,
  design: designSchema,
  services: servicesSchema,
  tolerances: tolerancesSchema.default({}),
  matching: matchingSchema.default({}),
  spacing: spacingSchema.default({}),
  checks: checksSchema.default({}),
  typography: typographySchema.default({}),
  color: colorSchema.default({}),
  output: outputSchema.default({}),
});

export type BulwarkConfig = z.infer<typeof bulwarkConfigSchema>;
export type BulwarkConfigInput = z.input<typeof bulwarkConfigSchema>;

/** Parses and defaults a configuration object, reporting every problem at once. */
export function parseConfig(input: unknown): BulwarkConfig {
  const result = bulwarkConfigSchema.safeParse(input);
  if (!result.success) {
    throw new ConfigurationError('Invalid Bulwark configuration', {
      issues: result.error.issues.map(
        (issue) => `${issue.path.length === 0 ? '<root>' : issue.path.join('.')}: ${issue.message}`,
      ),
    });
  }
  return result.data;
}
