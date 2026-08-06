import { clamp, roundHalfAwayFromZero } from '../numeric.js';

/** 8-bit sRGB channel triple. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export function createRgb(r: number, g: number, b: number): Rgb {
  return {
    r: toChannel(r),
    g: toChannel(g),
    b: toChannel(b),
  };
}

/** Parses `#rgb`, `#rrggbb`, `rgb(r g b)` and `rgba(r, g, b, a)`. */
export function parseColor(value: string): Rgb {
  const input = value.trim();

  const hexMatch = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input);
  if (hexMatch !== null) {
    const hex = hexMatch[1] as string;
    if (hex.length === 3) {
      const [r, g, b] = [...hex].map((char) => parseInt(char + char, 16)) as [number, number, number];
      return createRgb(r, g, b);
    }
    return createRgb(
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    );
  }

  const functionalMatch = /^rgba?\(([^)]+)\)$/i.exec(input);
  if (functionalMatch !== null) {
    const parts = (functionalMatch[1] as string)
      .split(/[\s,/]+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    if (parts.length < 3) {
      throw new SyntaxError(`Cannot parse color "${value}": expected at least three channels`);
    }
    const [r, g, b] = parts.slice(0, 3).map(parseChannel) as [number, number, number];
    return createRgb(r, g, b);
  }

  throw new SyntaxError(
    `Cannot parse color "${value}". Supported forms: #rgb, #rrggbb, rgb(...), rgba(...)`,
  );
}

export function toHex(color: Rgb): string {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
}

/**
 * Relative luminance per WCAG 2.1, used to decide whether a pixel is ink or paper
 * without assuming dark-on-light.
 */
export function relativeLuminance(color: Rgb): number {
  const linear = (channel: number): number => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(color.r) + 0.7152 * linear(color.g) + 0.0722 * linear(color.b);
}

export function colorsEqual(a: Rgb, b: Rgb): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b;
}

function toChannel(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Color channel must be finite, received ${value}`);
  }
  return clamp(roundHalfAwayFromZero(value), 0, 255);
}

function parseChannel(part: string): number {
  if (part.endsWith('%')) {
    const percent = Number.parseFloat(part.slice(0, -1));
    if (Number.isNaN(percent)) {
      throw new SyntaxError(`Cannot parse color channel "${part}"`);
    }
    return (percent / 100) * 255;
  }
  const numeric = Number.parseFloat(part);
  if (Number.isNaN(numeric)) {
    throw new SyntaxError(`Cannot parse color channel "${part}"`);
  }
  return numeric;
}

function channelToHex(channel: number): string {
  return channel.toString(16).padStart(2, '0');
}
