import type { BoundingBox } from '../geometry/box.js';
import { boxArea, boxCenter } from '../geometry/box.js';
import { compareStrings } from '../numeric.js';

/**
 * What a detector believes an element is. `text` elements are the only ones that
 * feed the typography checks; everything else is still measured for layout.
 */
export type ElementKind = 'text' | 'icon' | 'image' | 'container' | 'unknown';

/** Which of the two inputs an element was detected in. */
export type SurfaceId = 'design' | 'live';

/**
 * A single element as detected on one surface. Boxes are absolute pixels in that
 * surface's own image space; the pipeline normalises the two spaces before
 * matching so a Figma export at 2x still lines up with a 1x screenshot.
 */
export interface DetectedElement {
  readonly id: string;
  readonly surface: SurfaceId;
  readonly box: BoundingBox;
  readonly kind: ElementKind;
  /** Semantic label from the detector, e.g. "search icon". */
  readonly label: string;
  /** Text content the detector read, when it read any. */
  readonly text?: string;
  /** Detector confidence in [0, 1], when the detector reports one. */
  readonly confidence?: number;
}

/**
 * Total order over elements: reading order first (top to bottom, then left to
 * right), then id. Detectors are free to return elements in any order; sorting
 * through this comparator is what makes downstream output stable.
 */
export function compareElementsInReadingOrder(a: DetectedElement, b: DetectedElement): number {
  if (a.box.yMin !== b.box.yMin) return a.box.yMin - b.box.yMin;
  if (a.box.xMin !== b.box.xMin) return a.box.xMin - b.box.xMin;
  if (a.box.yMax !== b.box.yMax) return a.box.yMax - b.box.yMax;
  if (a.box.xMax !== b.box.xMax) return a.box.xMax - b.box.xMax;
  return compareStrings(a.id, b.id);
}

export function sortElementsInReadingOrder(
  elements: readonly DetectedElement[],
): DetectedElement[] {
  return [...elements].sort(compareElementsInReadingOrder);
}

export function isTextElement(element: DetectedElement): boolean {
  return element.kind === 'text';
}

export function elementCenter(element: DetectedElement) {
  return boxCenter(element.box);
}

export function elementArea(element: DetectedElement): number {
  return boxArea(element.box);
}

/**
 * Normalises a detector label so "Search Icon", "search  icon" and "search icon"
 * compare equal.
 */
export function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Normalises visible copy for comparison: trims, collapses whitespace, case-folds. */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}
