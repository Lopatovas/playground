import type { BoundingBox } from '@bulwark/domain';
import { roundTo } from '@bulwark/domain';
import type { GrayImage } from './grayscale.js';
import { histogram } from './grayscale.js';

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
