/**
 * Re-exports the adapter test doubles and the scene builder under one import, and
 * defines the reference layout the pipeline tests measure against.
 */
export {
  FakeElementDetector,
  FakeLiveInspector,
  FakeTextRasterizer,
  MemoryArtifactStore,
  MemoryResponseCache,
  RecordingLogger,
  buildLiveCapture,
  buildReferenceRenders,
  buildScene,
  inkHeightFor,
  mutateScene,
  shiftElement,
  strokeGeometryForWeight,
} from '@bulwark/adapters/testing';
export type { Scene, SceneElementSpec, SceneSpec, SceneTextSpec } from '@bulwark/adapters/testing';
export { InkProjectionRecognizer } from '@bulwark/adapters';

import type { SceneSpec } from '@bulwark/adapters/testing';

/**
 * A small landing-page card: a heading, a paragraph and a call to action inside a
 * container, with a 24px rhythm between them.
 *
 * The numbers are chosen so every derived value is exact: 24px Mark Pro leaves 20px
 * of ink (24 × 0.82) and 16px Open Sans leaves 14px (16 × 0.85), so a font-size
 * mismatch in a test is unambiguous rather than a rounding artefact.
 */
export const REFERENCE_SCENE: SceneSpec = {
  width: 800,
  height: 600,
  pageBackground: '#f8fafc',
  elements: [
    {
      id: 'card',
      box: [40, 40, 440, 260],
      kind: 'container',
      label: 'card',
      background: '#ffffff',
      domId: 'main>section',
      tagName: 'section',
    },
    {
      id: 'heading',
      box: [56, 64, 424, 108],
      kind: 'text',
      label: 'heading',
      background: '#ffffff',
      domId: 'main>section>h1',
      tagName: 'h1',
      text: {
        content: 'ShipFaster',
        fontFamily: 'Mark Pro',
        fontSizePx: 24,
        fontWeight: 700,
        color: '#111827',
      },
    },
    {
      id: 'body',
      box: [56, 132, 424, 168],
      kind: 'text',
      label: 'body copy',
      background: '#ffffff',
      domId: 'main>section>p',
      tagName: 'p',
      text: {
        content: 'Deterministic',
        fontFamily: 'Open Sans',
        fontSizePx: 16,
        fontWeight: 400,
        color: '#334155',
      },
    },
    {
      id: 'cta',
      box: [56, 192, 256, 240],
      kind: 'text',
      label: 'primary button',
      background: '#2563eb',
      domId: 'main>section>a',
      tagName: 'a',
      text: {
        content: 'GetStarted',
        fontFamily: 'Mark Pro',
        fontSizePx: 16,
        fontWeight: 700,
        color: '#ffffff',
      },
    },
  ],
};

/** Vertical gaps the reference scene declares, for readability in assertions. */
export const REFERENCE_GAPS = {
  headingToBody: 24,
  bodyToCta: 24,
} as const;
