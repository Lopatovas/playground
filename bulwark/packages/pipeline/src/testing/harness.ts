import { FixedClock, SequentialIdGenerator, sha256 } from '@bulwark/adapters';
import {
  FakeElementDetector,
  FakeLiveInspector,
  FakeTextRasterizer,
  InkProjectionRecognizer,
  MemoryArtifactStore,
  RecordingLogger,
  buildLiveCapture,
  buildReferenceRenders,
  buildScene,
} from './fixtures.js';
import type { Scene, SceneSpec } from './fixtures.js';
import type { LiveCapture, TextRenderResult } from '@bulwark/ports';
import type { BulwarkConfigInput } from '../config/config.js';
import { parseConfig } from '../config/config.js';
import { QaEngine } from '../engine/qa-engine.js';
import { QaRunner } from '../engine/qa-runner.js';
import { DESIGN_ARTIFACT_PATH, LIVE_ARTIFACT_PATH } from '../engine/qa-runner.js';

export interface HarnessOptions {
  readonly designSpec: SceneSpec;
  readonly liveSpec?: SceneSpec;
  readonly config?: Partial<BulwarkConfigInput>;
  /** Reference renders keyed by `family::text`; enables the font-family check. */
  readonly renders?: ReadonlyMap<string, TextRenderResult>;
  readonly availableFamilies?: readonly string[];
}

export interface Harness {
  readonly engine: QaEngine;
  readonly runner: QaRunner;
  readonly inspector: FakeLiveInspector;
  readonly config: ReturnType<typeof parseConfig>;
  readonly designScene: Scene;
  readonly liveScene: Scene;
  readonly live: LiveCapture;
  readonly store: MemoryArtifactStore;
  readonly logger: RecordingLogger;
  analyze(): ReturnType<QaEngine['analyze']>;
}

/**
 * Assembles a complete engine over synthetic surfaces.
 *
 * Every dependency is an in-memory fake except the analysis itself, so a test states
 * the design intent, states how the implementation deviates, and asserts on the
 * defects — with no browser, model or network in the loop.
 */
export function createHarness(options: HarnessOptions): Harness {
  const designScene = buildScene(options.designSpec);
  const liveScene = buildScene(options.liveSpec ?? options.designSpec);
  const live = buildLiveCapture(liveScene);

  const detector = FakeElementDetector.bySurface(designScene.detection, liveScene.detection);
  const rasterizer =
    options.renders === undefined
      ? undefined
      : new FakeTextRasterizer(options.renders, options.availableFamilies ?? []);

  const config = parseConfig({
    name: 'harness',
    target: {
      url: 'http://localhost:4173/',
      viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
    },
    design: { imagePath: 'figma-screenshot.png' },
    services: {
      detector: { kind: 'omniparser', baseUrl: 'http://omniparser:8000' },
      recognizer: { kind: 'ink-projection' },
      rasterizer: { kind: options.renders === undefined ? 'disabled' : 'playwright' },
    },
    output: { runId: 'test-run' },
    ...options.config,
  });

  const logger = new RecordingLogger();
  const engine = new QaEngine(
    {
      detector,
      recognizer: new InkProjectionRecognizer(),
      ...(rasterizer === undefined ? {} : { rasterizer }),
      clock: new FixedClock('2026-02-01T12:00:00.000Z', 5),
      ids: new SequentialIdGenerator('run'),
      logger,
    },
    config,
  );

  const store = new MemoryArtifactStore();
  const inspector = new FakeLiveInspector(live);
  const runner = new QaRunner(
    {
      engine,
      inspector,
      store,
      logger,
      readDesignImage: () => Promise.resolve(designScene.png),
    },
    config,
  );

  return {
    engine,
    runner,
    inspector,
    config,
    designScene,
    liveScene,
    live,
    store,
    logger,
    analyze: () =>
      engine.analyze({
        designImage: designScene.png,
        live,
        designImagePath: DESIGN_ARTIFACT_PATH,
        liveImagePath: LIVE_ARTIFACT_PATH,
      }),
  };
}

export { buildReferenceRenders, sha256 };
