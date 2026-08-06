import type { BoundingBox } from '@bulwark/domain';
import { median, roundTo } from '@bulwark/domain';
import type { InkMask } from './ink-mask.js';
import { maskAt } from './ink-mask.js';

/** Count of ink pixels per row (`axis: 'row'`) or per column. */
export function inkProfile(mask: InkMask, axis: 'row' | 'column'): Uint32Array {
  const length = axis === 'row' ? mask.height : mask.width;
  const other = axis === 'row' ? mask.width : mask.height;
  const profile = new Uint32Array(length);
  for (let index = 0; index < length; index += 1) {
    let count = 0;
    for (let cross = 0; cross < other; cross += 1) {
      count += axis === 'row' ? maskAt(mask, cross, index) : maskAt(mask, index, cross);
    }
    profile[index] = count;
  }
  return profile;
}

export interface Band {
  readonly start: number;
  /** Exclusive. */
  readonly end: number;
}

export interface BandOptions {
  /**
   * A slice counts as ink when its count is at least this share of the profile's
   * peak. Raising it discards anti-aliasing haze; 0 keeps every non-zero pixel.
   */
  readonly minPeakRatio: number;
  /** Bands thinner than this are dropped as noise. */
  readonly minBandSize: number;
  /** Gaps thinner than this do not split a band (kerning inside a word). */
  readonly maxGapToMerge: number;
}

export const DEFAULT_LINE_BAND_OPTIONS: BandOptions = {
  minPeakRatio: 0.05,
  minBandSize: 2,
  maxGapToMerge: 1,
};

export const DEFAULT_CHARACTER_BAND_OPTIONS: BandOptions = {
  minPeakRatio: 0.02,
  minBandSize: 1,
  maxGapToMerge: 0,
};

/** Contiguous runs of ink in a projection profile. */
export function findBands(profile: Uint32Array, options: BandOptions): readonly Band[] {
  if (options.minPeakRatio < 0 || options.minPeakRatio > 1) {
    throw new RangeError('findBands() requires minPeakRatio within [0, 1]');
  }

  let peak = 0;
  for (const value of profile) peak = Math.max(peak, value);
  if (peak === 0) return [];

  const threshold = Math.max(1, Math.ceil(peak * options.minPeakRatio));
  const raw: Band[] = [];
  let start: number | null = null;
  for (let index = 0; index < profile.length; index += 1) {
    const isInk = (profile[index] as number) >= threshold;
    if (isInk && start === null) start = index;
    if (!isInk && start !== null) {
      raw.push({ start, end: index });
      start = null;
    }
  }
  if (start !== null) raw.push({ start, end: profile.length });

  const merged: Band[] = [];
  for (const band of raw) {
    const previous = merged[merged.length - 1];
    if (previous !== undefined && band.start - previous.end <= options.maxGapToMerge) {
      merged[merged.length - 1] = { start: previous.start, end: band.end };
    } else {
      merged.push(band);
    }
  }

  return merged.filter((band) => band.end - band.start >= options.minBandSize);
}

/** Tightest box containing every ink pixel, in mask coordinates. */
export function tightInkBox(mask: InkMask): BoundingBox | null {
  let xMin = mask.width;
  let yMin = mask.height;
  let xMax = -1;
  let yMax = -1;

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (maskAt(mask, x, y) === 0) continue;
      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
      if (x > xMax) xMax = x;
      if (y > yMax) yMax = y;
    }
  }

  if (xMax < 0) return null;
  return { xMin, yMin, xMax: xMax + 1, yMax: yMax + 1 };
}

/**
 * How the visual height of a text crop is derived from its ink.
 *
 * - `median-character` measures every character's ink extent and takes the median
 *   top and bottom, so one descender or one tall ascender cannot inflate the result.
 * - `line-extent` takes the full ink extent of the line, matching what a tight OCR
 *   box reports.
 *
 * Both are defensible; they are not interchangeable, because the family ratio
 * constants must be calibrated with whichever one is in use.
 */
export type HeightMeasurementMode = 'median-character' | 'line-extent';

export interface TextInkOptions {
  readonly mode: HeightMeasurementMode;
  readonly lineBands: BandOptions;
  readonly characterBands: BandOptions;
}

export const DEFAULT_TEXT_INK_OPTIONS: TextInkOptions = {
  mode: 'median-character',
  lineBands: DEFAULT_LINE_BAND_OPTIONS,
  characterBands: DEFAULT_CHARACTER_BAND_OPTIONS,
};

export interface TextLineMeasurement {
  readonly box: BoundingBox;
  readonly visualHeightPx: number;
  readonly characterCount: number;
}

export interface TextInkMeasurement {
  /** Tightest box around all ink in the crop. */
  readonly tightBox: BoundingBox;
  readonly lines: readonly TextLineMeasurement[];
  /** Representative glyph height for the crop, in mask pixels. */
  readonly visualHeightPx: number;
  /** Ink coverage inside `tightBox`. */
  readonly strokeDensity: number;
}

/**
 * Measures glyph height by projection, the way the blueprint's character-level
 * vertical projection mapping describes.
 *
 * Rows of ink separate lines; columns of ink inside a line separate characters. The
 * result deliberately excludes the detector's block padding and line-height, since
 * those depend on layout rather than on the font size we are trying to recover.
 */
export function measureTextInk(
  mask: InkMask,
  options: TextInkOptions = DEFAULT_TEXT_INK_OPTIONS,
): TextInkMeasurement | null {
  const tightBox = tightInkBox(mask);
  if (tightBox === null) return null;

  const rowProfile = inkProfile(mask, 'row');
  const lineBands = findBands(rowProfile, options.lineBands);
  const bands = lineBands.length > 0 ? lineBands : [{ start: tightBox.yMin, end: tightBox.yMax }];

  const lines: TextLineMeasurement[] = [];
  for (const band of bands) {
    const line = measureLine(mask, band, options);
    if (line !== null) lines.push(line);
  }

  const visualHeightPx =
    lines.length > 0
      ? roundTo(median(lines.map((line) => line.visualHeightPx)), 4)
      : tightBox.yMax - tightBox.yMin;

  let inkInsideBox = 0;
  for (let y = tightBox.yMin; y < tightBox.yMax; y += 1) {
    for (let x = tightBox.xMin; x < tightBox.xMax; x += 1) {
      inkInsideBox += maskAt(mask, x, y);
    }
  }
  const boxArea = (tightBox.xMax - tightBox.xMin) * (tightBox.yMax - tightBox.yMin);

  return {
    tightBox,
    lines,
    visualHeightPx,
    strokeDensity: roundTo(inkInsideBox / boxArea, 6),
  };
}

function measureLine(mask: InkMask, band: Band, options: TextInkOptions): TextLineMeasurement | null {
  const columnCounts = new Uint32Array(mask.width);
  let xMin = mask.width;
  let xMax = -1;
  let yMin = mask.height;
  let yMax = -1;

  for (let x = 0; x < mask.width; x += 1) {
    let count = 0;
    for (let y = band.start; y < band.end; y += 1) {
      if (maskAt(mask, x, y) === 1) {
        count += 1;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
    columnCounts[x] = count;
    if (count > 0) {
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
    }
  }

  if (xMax < 0) return null;
  const box: BoundingBox = { xMin, yMin, xMax: xMax + 1, yMax: yMax + 1 };
  const lineExtent = box.yMax - box.yMin;

  if (options.mode === 'line-extent') {
    const characterBands = findBands(columnCounts, options.characterBands);
    return { box, visualHeightPx: lineExtent, characterCount: characterBands.length };
  }

  const characterBands = findBands(columnCounts, options.characterBands);
  const tops: number[] = [];
  const bottoms: number[] = [];
  for (const character of characterBands) {
    let top = -1;
    let bottom = -1;
    for (let y = band.start; y < band.end; y += 1) {
      for (let x = character.start; x < character.end; x += 1) {
        if (maskAt(mask, x, y) === 0) continue;
        if (top < 0) top = y;
        bottom = y;
        break;
      }
    }
    if (top >= 0) {
      tops.push(top);
      bottoms.push(bottom);
    }
  }

  if (tops.length === 0) {
    return { box, visualHeightPx: lineExtent, characterCount: 0 };
  }

  const visualHeightPx = roundTo(median(bottoms) - median(tops) + 1, 4);
  return { box, visualHeightPx, characterCount: characterBands.length };
}
