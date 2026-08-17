import type { BoundingBox, Rgb } from '@bulwark/domain';
import { createBox, createRgb, deltaE2000Rgb, relativeLuminance, roundTo } from '@bulwark/domain';
import type { GrayImage } from './grayscale.js';
import { histogram } from './grayscale.js';
import type { Raster } from './raster.js';
import { CHANNELS, cropRaster } from './raster.js';

/** Which side of the threshold the glyphs are on. */
export type InkPolarity = 'dark-on-light' | 'light-on-dark';

/**
 * A binary ink map for one text crop: 1 where a glyph stroke covers the pixel.
 */
export interface InkMask {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
  readonly threshold: number;
  readonly polarity: InkPolarity;
  readonly inkPixelCount: number;
}

/**
 * Otsu's method: the intensity threshold that maximises between-class variance.
 *
 * It is chosen here because it has no tunable parameters — the threshold falls out
 * of the crop's own histogram — so an ink measurement cannot drift because someone
 * changed a magic number, and dark text on a tinted card thresholds as correctly as
 * black on white.
 */
export function otsuThreshold(image: GrayImage): number {
  const bins = histogram(image);
  const total = image.data.length;
  if (total === 0) return 0;

  let sum = 0;
  for (let value = 0; value < 256; value += 1) {
    sum += value * (bins[value] as number);
  }

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let plateauStart = 0;
  let plateauEnd = 0;

  for (let threshold = 0; threshold < 256; threshold += 1) {
    backgroundWeight += bins[threshold] as number;
    if (backgroundWeight === 0) continue;
    const foregroundWeight = total - backgroundWeight;
    if (foregroundWeight === 0) break;

    backgroundSum += threshold * (bins[threshold] as number);
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;

    if (variance > bestVariance) {
      bestVariance = variance;
      plateauStart = threshold;
      plateauEnd = threshold;
    } else if (variance === bestVariance) {
      plateauEnd = threshold;
    }
  }

  // Empty histogram bins between the two modes all score identically. Taking the
  // middle of that plateau puts the threshold between the modes instead of flush
  // against whichever one the scan reached first.
  return Math.floor((plateauStart + plateauEnd) / 2);
}

/**
 * Splits a crop into ink and paper.
 *
 * Polarity is inferred from which class occupies less area, because glyph strokes
 * always cover less of a text box than the surrounding paper does. That keeps the
 * measurement valid for inverted UI (white text on a dark button) without asking the
 * caller to declare the theme.
 */
export function buildInkMask(image: GrayImage, polarityOverride?: InkPolarity): InkMask {
  const threshold = otsuThreshold(image);
  let darkCount = 0;
  for (const value of image.data) {
    if (value <= threshold) darkCount += 1;
  }
  const polarity: InkPolarity =
    polarityOverride ??
    (darkCount <= image.data.length - darkCount ? 'dark-on-light' : 'light-on-dark');

  const data = new Uint8Array(image.data.length);
  let inkPixelCount = 0;
  for (let index = 0; index < image.data.length; index += 1) {
    const value = image.data[index] as number;
    const isInk = polarity === 'dark-on-light' ? value <= threshold : value > threshold;
    if (isInk) {
      data[index] = 1;
      inkPixelCount += 1;
    }
  }

  return { width: image.width, height: image.height, data, threshold, polarity, inkPixelCount };
}

/**
 * Restricts an existing mask to a sub-region.
 *
 * Re-thresholding a crop that is already all ink is not equivalent: Otsu needs both
 * classes present, so a tight glyph crop would threshold into noise. Slicing the mask
 * that was computed with the full crop's context keeps the polarity decision intact.
 */
export function cropInkMask(mask: InkMask, region: BoundingBox): InkMask {
  const xMin = Math.max(0, Math.floor(region.xMin));
  const yMin = Math.max(0, Math.floor(region.yMin));
  const xMax = Math.min(mask.width, Math.ceil(region.xMax));
  const yMax = Math.min(mask.height, Math.ceil(region.yMax));
  const width = xMax - xMin;
  const height = yMax - yMin;
  if (width <= 0 || height <= 0) {
    throw new RangeError(
      `cropInkMask() region [${region.xMin}, ${region.yMin}, ${region.xMax}, ${region.yMax}] ` +
        `does not overlap a ${mask.width}x${mask.height} mask`,
    );
  }

  const data = new Uint8Array(width * height);
  let inkPixelCount = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const value = mask.data[(yMin + y) * mask.width + (xMin + x)] as number;
      data[y * width + x] = value;
      inkPixelCount += value;
    }
  }

  return {
    width,
    height,
    data,
    threshold: mask.threshold,
    polarity: mask.polarity,
    inkPixelCount,
  };
}

export function maskAt(mask: InkMask, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) {
    throw new RangeError(`Pixel (${x}, ${y}) is outside a ${mask.width}x${mask.height} mask`);
  }
  return mask.data[y * mask.width + x] as number;
}

/**
 * Share of ink pixels inside a region, which is the stroke-thickness signal the
 * weight bands are calibrated against.
 *
 * The denominator is the tight ink box rather than the detector's text box: a
 * detector box includes line-height padding and trailing space, so the same words at
 * the same weight would measure differently depending on how generous the box was.
 */
export function strokeDensity(
  mask: InkMask,
  region?: { xMin: number; yMin: number; xMax: number; yMax: number },
): number {
  const area = region ?? { xMin: 0, yMin: 0, xMax: mask.width, yMax: mask.height };
  const width = area.xMax - area.xMin;
  const height = area.yMax - area.yMin;
  if (width <= 0 || height <= 0) {
    throw new RangeError('strokeDensity() requires a region with positive area');
  }

  let ink = 0;
  for (let y = area.yMin; y < area.yMax; y += 1) {
    for (let x = area.xMin; x < area.xMax; x += 1) {
      ink += maskAt(mask, x, y);
    }
  }
  return roundTo(ink / (width * height), 6);
}

/**
 * Mean sRGB of pixels marked as ink. Used for font-color checks where k-means
 * on the whole crop would blend paper into the glyph pool.
 */
export function meanMaskedRgb(raster: Raster, mask: InkMask): Rgb | undefined {
  if (raster.width !== mask.width || raster.height !== mask.height) {
    throw new RangeError(
      `meanMaskedRgb() requires matching dimensions, got raster ` +
        `${raster.width}x${raster.height} and mask ${mask.width}x${mask.height}`,
    );
  }

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;
  for (let index = 0; index < mask.data.length; index += 1) {
    if (mask.data[index] !== 1) continue;
    const offset = index * CHANNELS;
    sumR += raster.data[offset] as number;
    sumG += raster.data[offset + 1] as number;
    sumB += raster.data[offset + 2] as number;
    count += 1;
  }
  if (count === 0) return undefined;
  return createRgb(Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count));
}

/**
 * Options for {@link extractInkColor}: border-background + farthest-mode ink.
 *
 * Preferred over grayscale Otsu for font-color QA — accent/link hues survive when
 * the sampler works in color space and takes a mode instead of a mean of AA fringes.
 */
export interface ExtractInkColorOptions {
  /** Border ring (px) used to estimate the paper/fill behind the glyphs. */
  readonly borderWidth: number;
  /** Quantization step for mode binning (16 → 16 RGB levels per channel). */
  readonly binSize: number;
  /** Minimum ΔE from background before a pixel counts as ink (drops AA blend). */
  readonly minDeltaE: number;
  /** Reject crops with too few ink pixels. */
  readonly minInkPixels: number;
  /** Glyphs should be a minority of the box; extremes usually mean a bad crop. */
  readonly minInkShare: number;
  readonly maxInkShare: number;
  /**
   * After the first pass, re-crop to the ink pixel bounds (+ pad) and sample again.
   * Drops detector padding / neighbor chrome without an OCR round-trip.
   */
  readonly tighten: boolean;
  /** Extra pixels around the tight ink box before the second pass. */
  readonly tightenPadPx: number;
}

export const DEFAULT_EXTRACT_INK_OPTIONS: ExtractInkColorOptions = {
  borderWidth: 1,
  binSize: 16,
  minDeltaE: 10,
  minInkPixels: 8,
  minInkShare: 0.02,
  maxInkShare: 0.45,
  tighten: true,
  tightenPadPx: 2,
};

/** Result of border-BG + farthest-mode ink sampling. */
export interface ExtractedInkColor {
  readonly color: Rgb;
  readonly background: Rgb;
  readonly polarity: InkPolarity;
  readonly inkPixelCount: number;
  readonly inkShare: number;
}

/**
 * Estimates font color without grayscale Otsu.
 *
 * 1. Mode of the border ring → background
 * 2. Keep pixels with ΔE(background) ≥ threshold (anti-aliased edges fall short)
 * 3. Mode of those pixels → ink (mean of the winning bin, not a global mean)
 * 4. Optionally re-crop to the ink bounds and repeat (tight pass)
 *
 * This is the usual screenshot-editor / document-CV pattern for “what color is the text?”
 */
export function extractInkColor(
  raster: Raster,
  options: Partial<ExtractInkColorOptions> = {},
): ExtractedInkColor | undefined {
  const opts = { ...DEFAULT_EXTRACT_INK_OPTIONS, ...options };
  const first = extractInkColorOnce(raster, opts);
  if (first === undefined || !opts.tighten) return first;

  const tight = inkPixelBounds(raster, first.background, opts.minDeltaE);
  if (tight === null) return first;

  const pad = Math.max(0, opts.tightenPadPx);
  const padded = createBox(
    Math.max(0, tight.xMin - pad),
    Math.max(0, tight.yMin - pad),
    Math.min(raster.width, tight.xMax + pad),
    Math.min(raster.height, tight.yMax + pad),
  );
  const tightArea = (padded.xMax - padded.xMin) * (padded.yMax - padded.yMin);
  const fullArea = raster.width * raster.height;
  // Only re-crop when the detector box had meaningful padding.
  if (fullArea === 0 || tightArea / fullArea > 0.85) return first;

  let cropped: Raster;
  try {
    cropped = cropRaster(raster, padded);
  } catch {
    return first;
  }
  if (cropped.width < 2 || cropped.height < 2) return first;

  const second = extractInkColorOnce(cropped, {
    ...opts,
    tighten: false,
    // Padding is gone, so glyph share is naturally higher than on a loose detector box.
    maxInkShare: Math.max(opts.maxInkShare, 0.85),
  });
  return second ?? first;
}

function extractInkColorOnce(
  raster: Raster,
  opts: ExtractInkColorOptions,
): ExtractedInkColor | undefined {
  const { width, height, data } = raster;
  const area = width * height;
  if (area === 0) return undefined;

  const borderWidth = Math.max(
    1,
    Math.min(opts.borderWidth, Math.floor(Math.min(width, height) / 2) || 1),
  );
  const borderBins = new Map<number, BinAccum>();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onBorder =
        x < borderWidth ||
        y < borderWidth ||
        x >= width - borderWidth ||
        y >= height - borderWidth;
      if (!onBorder) continue;
      const offset = (y * width + x) * CHANNELS;
      accumulateBin(borderBins, data, offset, opts.binSize);
    }
  }

  const background = meanOfRichestBin(borderBins);
  if (background === undefined) return undefined;

  const inkBins = new Map<number, BinAccum>();
  let inkPixelCount = 0;
  for (let index = 0; index < area; index += 1) {
    const offset = index * CHANNELS;
    const pixel = createRgb(
      data[offset] as number,
      data[offset + 1] as number,
      data[offset + 2] as number,
    );
    if (deltaE2000Rgb(background, pixel) < opts.minDeltaE) continue;
    accumulateBin(inkBins, data, offset, opts.binSize);
    inkPixelCount += 1;
  }

  if (inkPixelCount < opts.minInkPixels) return undefined;
  const inkShare = inkPixelCount / area;
  if (inkShare < opts.minInkShare || inkShare > opts.maxInkShare) return undefined;

  const color = meanOfRichestBin(inkBins);
  if (color === undefined) return undefined;

  // Ink that lands in the same bin as paper is not a usable font signal.
  if (
    quantizeKey(color.r, color.g, color.b, opts.binSize) ===
    quantizeKey(background.r, background.g, background.b, opts.binSize)
  ) {
    return undefined;
  }

  const polarity: InkPolarity =
    relativeLuminance(color) <= relativeLuminance(background) ? 'dark-on-light' : 'light-on-dark';

  return {
    color,
    background,
    polarity,
    inkPixelCount,
    inkShare: roundTo(inkShare, 6),
  };
}

/** Axis-aligned bounds of pixels that differ from `background` by ≥ `minDeltaE`. */
function inkPixelBounds(
  raster: Raster,
  background: Rgb,
  minDeltaE: number,
): BoundingBox | null {
  const { width, height, data } = raster;
  let xMin = width;
  let yMin = height;
  let xMax = 0;
  let yMax = 0;
  let found = false;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * CHANNELS;
      const pixel = createRgb(
        data[offset] as number,
        data[offset + 1] as number,
        data[offset + 2] as number,
      );
      if (deltaE2000Rgb(background, pixel) < minDeltaE) continue;
      found = true;
      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
      if (x + 1 > xMax) xMax = x + 1;
      if (y + 1 > yMax) yMax = y + 1;
    }
  }

  if (!found) return null;
  return createBox(xMin, yMin, xMax, yMax);
}

interface BinAccum {
  count: number;
  sumR: number;
  sumG: number;
  sumB: number;
}

function quantizeKey(r: number, g: number, b: number, binSize: number): number {
  const qr = Math.min(255, r) / binSize;
  const qg = Math.min(255, g) / binSize;
  const qb = Math.min(255, b) / binSize;
  return ((qr | 0) << 16) | ((qg | 0) << 8) | (qb | 0);
}

function accumulateBin(
  bins: Map<number, BinAccum>,
  data: Uint8Array,
  offset: number,
  binSize: number,
): void {
  const r = data[offset] as number;
  const g = data[offset + 1] as number;
  const b = data[offset + 2] as number;
  const key = quantizeKey(r, g, b, binSize);
  const existing = bins.get(key);
  if (existing === undefined) {
    bins.set(key, { count: 1, sumR: r, sumG: g, sumB: b });
    return;
  }
  existing.count += 1;
  existing.sumR += r;
  existing.sumG += g;
  existing.sumB += b;
}

function meanOfRichestBin(bins: Map<number, BinAccum>): Rgb | undefined {
  let best: BinAccum | undefined;
  for (const bin of bins.values()) {
    if (best === undefined || bin.count > best.count) best = bin;
  }
  if (best === undefined || best.count === 0) return undefined;
  return createRgb(
    Math.round(best.sumR / best.count),
    Math.round(best.sumG / best.count),
    Math.round(best.sumB / best.count),
  );
}
