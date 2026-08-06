import type { DetectedElement, ElementKind, SurfaceId } from '../elements/element.js';
import { createBox } from '../geometry/box.js';

export interface ElementSpec {
  readonly id: string;
  readonly box: readonly [number, number, number, number];
  readonly kind?: ElementKind;
  readonly label?: string;
  readonly text?: string;
  readonly confidence?: number;
}

/** Builds a detected element for tests without repeating boilerplate. */
export function element(surface: SurfaceId, spec: ElementSpec): DetectedElement {
  return {
    id: spec.id,
    surface,
    box: createBox(spec.box[0], spec.box[1], spec.box[2], spec.box[3]),
    kind: spec.kind ?? 'container',
    label: spec.label ?? spec.id,
    ...(spec.text === undefined ? {} : { text: spec.text }),
    ...(spec.confidence === undefined ? {} : { confidence: spec.confidence }),
  };
}

export function designElement(spec: ElementSpec): DetectedElement {
  return element('design', spec);
}

export function liveElement(spec: ElementSpec): DetectedElement {
  return element('live', spec);
}

/** Shifts a box by a fixed offset, the usual way to simulate layout drift. */
export function shifted(
  spec: ElementSpec,
  dx: number,
  dy: number,
  overrides: Partial<ElementSpec> = {},
): ElementSpec {
  return {
    ...spec,
    ...overrides,
    box: [spec.box[0] + dx, spec.box[1] + dy, spec.box[2] + dx, spec.box[3] + dy],
  };
}
