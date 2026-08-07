import { roundTo } from '@bulwark/domain';
import type { GrayImage } from './grayscale.js';

export interface SsimOptions {
  /** Gaussian window size in pixels; must be odd. */
  readonly windowSize: number;
  readonly sigma: number;
  /** Dynamic range of the signal (255 for 8-bit images). */
  readonly dynamicRange: number;
  readonly k1: number;
  readonly k2: number;
}

export const DEFAULT_SSIM_OPTIONS: SsimOptions = {
  windowSize: 11,
  sigma: 1.5,
  dynamicRange: 255,
  k1: 0.01,
  k2: 0.03,
};

export interface SsimResult {
  /** Mean SSIM across all windows, in [-1, 1]. */
  readonly score: number;
  readonly windowCount: number;
}

/**
 * Structural similarity between two equally-sized grayscale images.
 *
 * SSIM is the right comparison for "is this the same glyph shape": it is computed on
 * local means, variances and covariance, so it survives the small brightness and
 * contrast differences between a design export and a browser-rendered reference,
 * while a pixel-difference metric would drown in anti-aliasing noise.
 *
 * Images smaller than one window fall back to a single global window rather than
 * refusing to score, since a text crop is often only a few pixels tall.
 */
export function ssim(
  a: GrayImage,
  b: GrayImage,
  options: SsimOptions = DEFAULT_SSIM_OPTIONS,
): SsimResult {
  if (a.width !== b.width || a.height !== b.height) {
    throw new RangeError(
      `ssim() requires equally-sized images, received ${a.width}x${a.height} and ${b.width}x${b.height}`,
    );
  }
  assertOptions(options);

  const c1 = (options.k1 * options.dynamicRange) ** 2;
  const c2 = (options.k2 * options.dynamicRange) ** 2;

  const window = Math.min(options.windowSize, oddFloor(a.width), oddFloor(a.height));
  if (window < 3) {
    return { score: roundTo(globalSsim(a, b, c1, c2), 6), windowCount: 1 };
  }

  const kernel = gaussianKernel(window, options.sigma);
  const radius = (window - 1) / 2;

  let total = 0;
  let windowCount = 0;

  for (let centerY = radius; centerY < a.height - radius; centerY += 1) {
    for (let centerX = radius; centerX < a.width - radius; centerX += 1) {
      let meanA = 0;
      let meanB = 0;
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const weight = kernel[(offsetY + radius) * window + (offsetX + radius)] as number;
          meanA += weight * pixel(a, centerX + offsetX, centerY + offsetY);
          meanB += weight * pixel(b, centerX + offsetX, centerY + offsetY);
        }
      }

      let varianceA = 0;
      let varianceB = 0;
      let covariance = 0;
      for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
        for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
          const weight = kernel[(offsetY + radius) * window + (offsetX + radius)] as number;
          const deltaA = pixel(a, centerX + offsetX, centerY + offsetY) - meanA;
          const deltaB = pixel(b, centerX + offsetX, centerY + offsetY) - meanB;
          varianceA += weight * deltaA * deltaA;
          varianceB += weight * deltaB * deltaB;
          covariance += weight * deltaA * deltaB;
        }
      }

      const numerator = (2 * meanA * meanB + c1) * (2 * covariance + c2);
      const denominator = (meanA ** 2 + meanB ** 2 + c1) * (varianceA + varianceB + c2);
      total += numerator / denominator;
      windowCount += 1;
    }
  }

  if (windowCount === 0) {
    return { score: roundTo(globalSsim(a, b, c1, c2), 6), windowCount: 1 };
  }

  return { score: roundTo(total / windowCount, 6), windowCount };
}

function globalSsim(a: GrayImage, b: GrayImage, c1: number, c2: number): number {
  const count = a.data.length;
  let sumA = 0;
  let sumB = 0;
  for (let index = 0; index < count; index += 1) {
    sumA += a.data[index] as number;
    sumB += b.data[index] as number;
  }
  const meanA = sumA / count;
  const meanB = sumB / count;

  let varianceA = 0;
  let varianceB = 0;
  let covariance = 0;
  for (let index = 0; index < count; index += 1) {
    const deltaA = (a.data[index] as number) - meanA;
    const deltaB = (b.data[index] as number) - meanB;
    varianceA += deltaA * deltaA;
    varianceB += deltaB * deltaB;
    covariance += deltaA * deltaB;
  }
  varianceA /= count;
  varianceB /= count;
  covariance /= count;

  const numerator = (2 * meanA * meanB + c1) * (2 * covariance + c2);
  const denominator = (meanA ** 2 + meanB ** 2 + c1) * (varianceA + varianceB + c2);
  return numerator / denominator;
}

export function gaussianKernel(size: number, sigma: number): Float64Array {
  if (size % 2 === 0 || size < 1) {
    throw new RangeError(`gaussianKernel() requires an odd positive size, received ${size}`);
  }
  if (sigma <= 0) {
    throw new RangeError(`gaussianKernel() requires sigma > 0, received ${sigma}`);
  }

  const radius = (size - 1) / 2;
  const kernel = new Float64Array(size * size);
  let total = 0;
  for (let y = -radius; y <= radius; y += 1) {
    for (let x = -radius; x <= radius; x += 1) {
      const weight = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      kernel[(y + radius) * size + (x + radius)] = weight;
      total += weight;
    }
  }
  for (let index = 0; index < kernel.length; index += 1) {
    kernel[index] = (kernel[index] as number) / total;
  }
  return kernel;
}

function pixel(image: GrayImage, x: number, y: number): number {
  return image.data[y * image.width + x] as number;
}

function oddFloor(value: number): number {
  return value % 2 === 0 ? value - 1 : value;
}

function assertOptions(options: SsimOptions): void {
  if (options.windowSize % 2 === 0 || options.windowSize < 3) {
    throw new RangeError(`ssim() requires an odd windowSize >= 3, received ${options.windowSize}`);
  }
  if (options.sigma <= 0) throw new RangeError('ssim() requires sigma > 0');
  if (options.dynamicRange <= 0) throw new RangeError('ssim() requires dynamicRange > 0');
}
