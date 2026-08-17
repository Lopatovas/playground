import type { BoundingBox } from '@bulwark/domain';
import type { GrayImage } from './grayscale.js';
import { toGrayscale } from './grayscale.js';
import type { InkMask } from './ink-mask.js';
import { buildInkMask, cropInkMask } from './ink-mask.js';
import type { TextInkMeasurement, TextInkOptions } from './projection.js';
import { DEFAULT_TEXT_INK_OPTIONS, measureTextInk } from './projection.js';
import type { Raster } from './raster.js';
import { inkMaskToGray } from './resize.js';

export interface GlyphShapeMeasurement {
  readonly measurement: TextInkMeasurement;
  /** Ink rendered black-on-white and cropped to the glyphs, ready for comparison. */
  readonly shape: GrayImage;
  /** Mask the measurement was taken from, in the analysed region's coordinates. */
  readonly mask: InkMask;
}

/**
 * Measures the glyphs in a text crop and produces a normalised shape image.
 *
 * The threshold is always computed on the full crop, where both ink and paper are
 * present, and only then narrowed to a region. Thresholding a region that is nothing
 * but glyph pixels has no second class to separate and produces a mask of noise —
 * which is exactly how light text on a dark button used to disappear.
 */
export function measureGlyphShape(
  crop: Raster,
  options: {
    /** Region of the crop to measure, e.g. a tight OCR box. Defaults to the whole crop. */
    readonly region?: BoundingBox;
    readonly textInk?: TextInkOptions;
  } = {},
): GlyphShapeMeasurement | null {
  const fullMask = buildInkMask(toGrayscale(crop));
  const mask = options.region === undefined ? fullMask : cropInkMask(fullMask, options.region);
  const measurement = measureTextInk(mask, options.textInk ?? DEFAULT_TEXT_INK_OPTIONS);
  if (measurement === null) return null;

  return {
    measurement,
    shape: inkMaskToGray(cropInkMask(mask, measurement.tightBox)),
    mask,
  };
}
