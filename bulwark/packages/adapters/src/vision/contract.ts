import { z } from 'zod';

/**
 * Wire contract shared with the Python vision services.
 *
 * Both sides validate against this shape. A model upgrade that quietly changes a
 * field name then fails loudly at the boundary instead of producing boxes full of
 * `undefined` that would read as layout defects.
 */

export const VISION_API_VERSION = 'v1';

const boxSchema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .describe('[xmin, ymin, xmax, ymax] in absolute pixels');

export const elementKindSchema = z.enum(['text', 'icon', 'image', 'container', 'unknown']);

export const detectionElementSchema = z.object({
  box: boxSchema,
  label: z.string().min(1),
  kind: elementKindSchema.default('unknown'),
  confidence: z.number().min(0).max(1).optional(),
  text: z.string().optional(),
  interactive: z.boolean().optional(),
});

export const detectionResponseSchema = z.object({
  model: z.string().min(1),
  image: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  elements: z.array(detectionElementSchema),
});

export const detectionRequestSchema = z.object({
  image_base64: z.string().min(1),
  surface: z.enum(['design', 'live']),
  min_confidence: z.number().min(0).max(1).optional(),
  max_overlap: z.number().min(0).max(1).optional(),
});

export const recognitionRunSchema = z.object({
  box: boxSchema,
  text: z.string(),
  confidence: z.number().min(0).max(1).optional(),
});

export const recognitionResponseSchema = z.object({
  model: z.string().min(1),
  runs: z.array(recognitionRunSchema),
});

export const recognitionRequestSchema = z.object({
  image_base64: z.string().min(1),
  min_confidence: z.number().min(0).max(1).optional(),
});

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  model: z.string().min(1),
  /** False when the service is running its parameter-free fallback. */
  weights_loaded: z.boolean().optional(),
});

export type DetectionResponsePayload = z.infer<typeof detectionResponseSchema>;
export type RecognitionResponsePayload = z.infer<typeof recognitionResponseSchema>;
export type HealthResponsePayload = z.infer<typeof healthResponseSchema>;
