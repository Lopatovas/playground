import { describe, expect, it } from 'vitest';
import { createBox } from '@bulwark/domain';
import type { DetectionResult, LiveDomElement } from '@bulwark/ports';
import { associateDomElements, domElementKind, normalizeDetection, prefersTextLeaf } from './normalize.js';

function detection(
  regions: readonly {
    box: readonly [number, number, number, number];
    label: string;
    kind?: 'text' | 'icon' | 'container' | 'image' | 'unknown';
  }[],
  size = { width: 800, height: 600 },
): DetectionResult {
  return {
    regions: regions.map((region) => ({
      box: createBox(...region.box),
      label: region.label,
      kind: region.kind ?? 'container',
    })),
    imageWidth: size.width,
    imageHeight: size.height,
    model: 'test',
  };
}

function domElement(
  overrides: Partial<LiveDomElement> & Pick<LiveDomElement, 'id' | 'box'>,
): LiveDomElement {
  return {
    tagName: 'div',
    text: null,
    style: {
      fontFamily: 'system-ui',
      fontSizePx: 16,
      fontWeight: 400,
      lineHeightPx: 24,
      letterSpacingPx: 0,
      color: 'rgb(0, 0, 0)',
      backgroundColor: 'rgb(255, 255, 255)',
      borderRadiusPx: 0,
      opacity: 1,
    },
    hasTransparentBackground: false,
    depth: 1,
    ...overrides,
  };
}

describe('normalizeDetection', () => {
  it('assigns ids in reading order, not detector order', () => {
    const result = normalizeDetection(
      detection([
        { box: [40, 200, 200, 240], label: 'footer' },
        { box: [40, 40, 200, 80], label: 'header' },
        { box: [220, 40, 380, 80], label: 'nav' },
      ]),
      { surface: 'design', pixelRatio: 1, imageSize: { width: 800, height: 600 } },
    );

    expect(result.map((item) => [item.element.id, item.element.label])).toEqual([
      ['design-001', 'header'],
      ['design-002', 'nav'],
      ['design-003', 'footer'],
    ]);
  });

  it('produces the same ids no matter how the detector ordered its output', () => {
    const regions = [
      { box: [40, 40, 200, 80] as const, label: 'header' },
      { box: [40, 200, 200, 240] as const, label: 'footer' },
    ];
    const forward = normalizeDetection(detection(regions), {
      surface: 'design',
      pixelRatio: 1,
      imageSize: { width: 800, height: 600 },
    });
    const reversed = normalizeDetection(detection([...regions].reverse()), {
      surface: 'design',
      pixelRatio: 1,
      imageSize: { width: 800, height: 600 },
    });

    expect(forward.map((item) => item.element.id)).toEqual(reversed.map((item) => item.element.id));
    expect(forward.map((item) => item.element.label)).toEqual(
      reversed.map((item) => item.element.label),
    );
  });

  it('prefixes ids with the surface so design and live ids never collide', () => {
    const live = normalizeDetection(detection([{ box: [0, 0, 10, 10], label: 'a' }]), {
      surface: 'live',
      pixelRatio: 1,
      imageSize: { width: 800, height: 600 },
    });
    expect(live[0]?.element.id).toBe('live-001');
    expect(live[0]?.element.surface).toBe('live');
  });

  it('converts a 2x export into CSS pixels while keeping the image box for cropping', () => {
    const result = normalizeDetection(
      detection([{ box: [80, 120, 400, 200], label: 'heading', kind: 'text' }], {
        width: 1600,
        height: 1200,
      }),
      { surface: 'design', pixelRatio: 2, imageSize: { width: 1600, height: 1200 } },
    );

    expect(result[0]?.element.box).toEqual({ xMin: 40, yMin: 60, xMax: 200, yMax: 100 });
    expect(result[0]?.sourceBox).toEqual({ xMin: 80, yMin: 120, xMax: 400, yMax: 200 });
  });

  it('leaves boxes untouched at 1x', () => {
    const result = normalizeDetection(detection([{ box: [10, 20, 30, 40], label: 'a' }]), {
      surface: 'design',
      pixelRatio: 1,
      imageSize: { width: 800, height: 600 },
    });
    expect(result[0]?.element.box).toEqual(result[0]?.sourceBox);
  });

  it('carries the detector text and confidence through', () => {
    const result = normalizeDetection(
      {
        regions: [
          {
            box: createBox(0, 0, 10, 10),
            label: 'cta',
            kind: 'text',
            text: 'Get Started',
            confidence: 0.81,
          },
        ],
        imageWidth: 800,
        imageHeight: 600,
        model: 'test',
      },
      { surface: 'design', pixelRatio: 1, imageSize: { width: 800, height: 600 } },
    );

    expect(result[0]?.element).toMatchObject({ text: 'Get Started', confidence: 0.81 });
  });
});

describe('associateDomElements', () => {
  const elements = normalizeDetection(
    detection([{ box: [56, 192, 256, 240], label: 'primary button', kind: 'text' }]),
    { surface: 'live', pixelRatio: 1, imageSize: { width: 800, height: 600 } },
  );

  it('attaches the DOM node that covers the element', () => {
    const button = domElement({
      id: 'main>a',
      box: createBox(56, 192, 256, 240),
      tagName: 'a',
      text: 'Get Started',
      depth: 3,
    });

    const result = associateDomElements(elements, [button]);
    expect(result.elements[0]?.dom?.id).toBe('main>a');
    expect(result.elements[0]?.element.text).toBe('Get Started');
    expect(result.unassociatedElementIds).toEqual([]);
  });

  it('prefers the node that actually renders the text over an equally-sized wrapper', () => {
    const wrapper = domElement({ id: 'main>a', box: createBox(56, 192, 256, 240), depth: 3 });
    const span = domElement({
      id: 'main>a>span',
      box: createBox(56, 192, 256, 240),
      tagName: 'span',
      text: 'Get Started',
      depth: 4,
    });

    const result = associateDomElements(elements, [wrapper, span]);
    expect(result.elements[0]?.dom?.id).toBe('main>a>span');
  });

  it('prefers the closest geometric match when several nodes carry text', () => {
    const near = domElement({
      id: 'main>a',
      box: createBox(56, 192, 256, 240),
      text: 'Get Started',
      depth: 2,
    });
    const loose = domElement({
      id: 'main',
      box: createBox(40, 180, 300, 260),
      text: 'Get Started elsewhere',
      depth: 1,
    });

    const result = associateDomElements(elements, [loose, near]);
    expect(result.elements[0]?.dom?.id).toBe('main>a');
  });

  it('falls back to a non-text node rather than dropping the styles', () => {
    const wrapper = domElement({ id: 'main>div', box: createBox(56, 192, 256, 240), depth: 2 });
    const result = associateDomElements(elements, [wrapper]);

    expect(result.elements[0]?.dom?.id).toBe('main>div');
    expect(result.elements[0]?.element.text).toBeUndefined();
  });

  it('reports elements with no overlapping DOM node', () => {
    const far = domElement({ id: 'footer', box: createBox(0, 500, 100, 560) });
    const result = associateDomElements(elements, [far]);

    expect(result.unassociatedElementIds).toEqual(['live-001']);
    expect(result.elements[0]?.dom).toBeUndefined();
  });

  it('prefers a text leaf inside Button/icon chrome over the wrapper', () => {
    const iconElements = normalizeDetection(
      detection([{ box: [56, 192, 256, 240], label: 'Button', kind: 'icon' }]),
      { surface: 'live', pixelRatio: 1, imageSize: { width: 800, height: 600 } },
    );
    const wrapper = domElement({
      id: 'main>button',
      box: createBox(56, 192, 256, 240),
      tagName: 'button',
      depth: 3,
    });
    const label = domElement({
      id: 'main>button>span',
      box: createBox(80, 204, 220, 228),
      tagName: 'span',
      text: 'Sign in',
      depth: 4,
    });

    const result = associateDomElements(iconElements, [wrapper, label]);
    expect(result.elements[0]?.dom?.id).toBe('main>button>span');
    expect(result.elements[0]?.element.text).toBe('Sign in');
  });

  it('does not force text leaves onto pure image detections', () => {
    const imageElements = normalizeDetection(
      detection([{ box: [56, 192, 256, 240], label: 'Hero', kind: 'image' }]),
      { surface: 'live', pixelRatio: 1, imageSize: { width: 800, height: 600 } },
    );
    const photo = domElement({
      id: 'main>img',
      box: createBox(56, 192, 256, 240),
      tagName: 'img',
      depth: 3,
    });
    const caption = domElement({
      id: 'main>p',
      box: createBox(60, 200, 200, 230),
      tagName: 'p',
      text: 'Caption',
      depth: 3,
    });

    const result = associateDomElements(imageElements, [photo, caption]);
    expect(result.elements[0]?.dom?.id).toBe('main>img');
  });
});

describe('prefersTextLeaf', () => {
  it('treats text, icon, container, and unknown as text-bearing', () => {
    expect(prefersTextLeaf('text')).toBe(true);
    expect(prefersTextLeaf('icon')).toBe(true);
    expect(prefersTextLeaf('container')).toBe(true);
    expect(prefersTextLeaf('unknown')).toBe(true);
    expect(prefersTextLeaf('image')).toBe(false);
  });
});

describe('domElementKind', () => {
  it('classifies by content and tag', () => {
    expect(domElementKind(domElement({ id: 'a', box: createBox(0, 0, 10, 10), text: 'hi' }))).toBe(
      'text',
    );
    expect(
      domElementKind(domElement({ id: 'a', box: createBox(0, 0, 10, 10), tagName: 'img' })),
    ).toBe('image');
    expect(domElementKind(domElement({ id: 'a', box: createBox(0, 0, 10, 10) }))).toBe('container');
  });
});
