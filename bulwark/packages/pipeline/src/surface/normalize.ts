import type { BoundingBox, DetectedElement, ElementKind, Size, SurfaceId } from '@bulwark/domain';
import { compareElementsInReadingOrder, intersectionOverUnion, scaleBox } from '@bulwark/domain';
import type { DetectionResult, LiveDomElement } from '@bulwark/ports';

/**
 * A detected element in two coordinate spaces at once.
 *
 * `element.box` is in comparison space (CSS pixels), which is the only space where a
 * design export and a browser screenshot can be compared. `sourceBox` stays in the
 * surface's own image pixels, because that is what a crop has to be taken in.
 */
export interface SurfaceElement {
  readonly element: DetectedElement;
  readonly sourceBox: BoundingBox;
  /** DOM node behind this element, when the surface is the live page. */
  readonly dom?: LiveDomElement;
}

export interface NormalizeOptions {
  readonly surface: SurfaceId;
  /**
   * Image pixels per comparison pixel. 2 for a 2x design export or a screenshot
   * taken at deviceScaleFactor 2.
   */
  readonly pixelRatio: number;
  readonly imageSize: Size;
}

/**
 * Converts a detector result into domain elements with stable ids.
 *
 * Ids are assigned from reading order rather than from the detector's own ordering,
 * so two runs of the same surface produce the same ids even if the model returns its
 * boxes in a different sequence — which is what makes defect ids stable enough to
 * diff between runs.
 */
export function normalizeDetection(
  detection: DetectionResult,
  options: NormalizeOptions,
): readonly SurfaceElement[] {
  const comparisonSize: Size = {
    width: options.imageSize.width / options.pixelRatio,
    height: options.imageSize.height / options.pixelRatio,
  };

  const staged = detection.regions.map((region) => ({
    sourceBox: region.box,
    comparisonBox:
      options.pixelRatio === 1
        ? region.box
        : scaleBox(region.box, options.imageSize, comparisonSize),
    label: region.label,
    kind: region.kind,
    text: region.text,
    confidence: region.confidence,
  }));

  staged.sort((a, b) => {
    if (a.comparisonBox.yMin !== b.comparisonBox.yMin) {
      return a.comparisonBox.yMin - b.comparisonBox.yMin;
    }
    if (a.comparisonBox.xMin !== b.comparisonBox.xMin) {
      return a.comparisonBox.xMin - b.comparisonBox.xMin;
    }
    return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
  });

  return staged.map((region, index) => ({
    element: {
      id: `${options.surface}-${String(index + 1).padStart(3, '0')}`,
      surface: options.surface,
      box: region.comparisonBox,
      kind: region.kind,
      label: region.label,
      ...(region.text === undefined ? {} : { text: region.text }),
      ...(region.confidence === undefined ? {} : { confidence: region.confidence }),
    },
    sourceBox: region.sourceBox,
  }));
}

export interface DomAssociationOptions {
  /** Minimum overlap before a DOM node is accepted as an element's source. */
  readonly minIou: number;
}

export const DEFAULT_DOM_ASSOCIATION_OPTIONS: DomAssociationOptions = { minIou: 0.5 };

export interface DomAssociation {
  readonly elements: readonly SurfaceElement[];
  /** Ids of live elements no DOM node could be attached to. */
  readonly unassociatedElementIds: readonly string[];
}

/**
 * Attaches computed styles to detected live elements.
 *
 * The detector finds what is visible; the DOM knows what the browser was told to
 * render. Joining them by overlap is what lets a defect say "the design implies 24px
 * and the stylesheet says 18px" instead of only "these pixels differ".
 *
 * Where several nodes cover the same region — a button wrapping a span wrapping text —
 * the deepest node that carries text wins for text elements, since that is the node
 * whose font actually applies.
 */
export function associateDomElements(
  elements: readonly SurfaceElement[],
  domElements: readonly LiveDomElement[],
  options: DomAssociationOptions = DEFAULT_DOM_ASSOCIATION_OPTIONS,
): DomAssociation {
  const associated: SurfaceElement[] = [];
  const unassociated: string[] = [];

  for (const surfaceElement of elements) {
    const wantsText = surfaceElement.element.kind === 'text';
    const overlapping = domElements
      .map((dom) => ({ dom, iou: intersectionOverUnion(surfaceElement.element.box, dom.box) }))
      .filter((candidate) => candidate.iou >= options.minIou);

    // A text element prefers a node that actually renders text, but falls back to
    // the best geometric match rather than losing its styles entirely.
    const textCarrying = overlapping.filter((candidate) => candidate.dom.text !== null);
    const candidates = wantsText && textCarrying.length > 0 ? textCarrying : overlapping;

    candidates.sort((a, b) => {
      if (a.iou !== b.iou) return b.iou - a.iou;
      if (a.dom.depth !== b.dom.depth) return b.dom.depth - a.dom.depth;
      return a.dom.id < b.dom.id ? -1 : 1;
    });

    const best = candidates[0];
    if (best === undefined) {
      unassociated.push(surfaceElement.element.id);
      associated.push(surfaceElement);
      continue;
    }

    associated.push({
      element: {
        ...surfaceElement.element,
        ...(best.dom.text === null ? {} : { text: best.dom.text }),
      },
      sourceBox: surfaceElement.sourceBox,
      dom: best.dom,
    });
  }

  return { elements: associated, unassociatedElementIds: unassociated };
}

/** Classifies a DOM node when the live surface is read from the DOM alone. */
export function domElementKind(element: LiveDomElement): ElementKind {
  if (element.text !== null) return 'text';
  if (element.tagName === 'img' || element.tagName === 'svg' || element.tagName === 'picture') {
    return 'image';
  }
  return 'container';
}

export function sortSurfaceElements(
  elements: readonly SurfaceElement[],
): readonly SurfaceElement[] {
  return [...elements].sort((a, b) => compareElementsInReadingOrder(a.element, b.element));
}
