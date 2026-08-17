import type { BoundingBox, Viewport } from '@bulwark/domain';

/**
 * Computed style values read from a live DOM node.
 *
 * These are the ground truth the raster measurements are checked against: the design
 * side is inferred from pixels, the live side is read from the browser, and a defect
 * is a disagreement between the two.
 */
export interface LiveComputedStyle {
  readonly fontFamily: string;
  readonly fontSizePx: number;
  readonly fontWeight: number;
  readonly lineHeightPx: number | null;
  readonly letterSpacingPx: number | null;
  readonly color: string;
  readonly backgroundColor: string;
  readonly borderRadiusPx: number | null;
  readonly opacity: number;
}

export interface LiveDomElement {
  /** Stable identifier derived from the DOM position, e.g. `body>main>h1`. */
  readonly id: string;
  readonly tagName: string;
  /** Viewport-space box in CSS pixels. */
  readonly box: BoundingBox;
  /** Trimmed text content when the node renders text directly. */
  readonly text: string | null;
  readonly style: LiveComputedStyle;
  /** True when the node's own background is transparent, so color checks skip it. */
  readonly hasTransparentBackground: boolean;
  /** Depth in the DOM, used to prefer the innermost node covering a region. */
  readonly depth: number;
}

export interface LiveCaptureRequest {
  readonly url: string;
  readonly viewport: Viewport;
  /** Full-page capture instead of just the viewport. */
  readonly fullPage?: boolean;
  /** CSS selector to wait for before capturing. */
  readonly waitForSelector?: string;
  /** Extra settle time in milliseconds after load, for fonts and transitions. */
  readonly settleMs?: number;
  /**
   * Freeze animations, hide carets and disable smooth scrolling before capture.
   * Without it, two captures of the same page differ and every run reports noise.
   */
  readonly stabilize?: boolean;
}

export interface LiveCapture {
  /** PNG bytes of the screenshot. */
  readonly screenshot: Uint8Array;
  readonly elements: readonly LiveDomElement[];
  readonly viewport: Viewport;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly url: string;
  /** Browser build string, recorded so a report says what rendered it. */
  readonly engine: string;
}

/**
 * Captures the live implementation: one screenshot plus the metadata behind it.
 *
 * Taking both in the same session is deliberate — a screenshot and a style read from
 * two different page loads can disagree, and the pipeline would report the
 * difference as a defect.
 */
export interface LiveInspector {
  readonly name: string;
  capture(request: LiveCaptureRequest): Promise<LiveCapture>;
}
