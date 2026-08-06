import { FixedClock, InkProjectionRecognizer, SequentialIdGenerator } from '@bulwark/adapters';
import {
  FakeElementDetector,
  FakeLiveInspector,
  MemoryArtifactStore,
  RecordingLogger,
  buildLiveCapture,
  buildScene,
} from '@bulwark/adapters/testing';
import type { Scene, SceneSpec } from '@bulwark/adapters/testing';
import type { BulwarkConfigInput } from '@bulwark/pipeline';
import { parseConfig } from '@bulwark/pipeline';
import type { CliContext } from '../commands/context.js';
import type { LoadedConfig } from '../config-loader.js';

export interface CliHarnessOptions {
  readonly designSpec: SceneSpec;
  readonly liveSpec?: SceneSpec;
  readonly configOverrides?: Partial<BulwarkConfigInput>;
  /** Files the context can read, keyed by absolute-ish path. */
  readonly files?: ReadonlyMap<string, Uint8Array>;
}

export interface CliHarness {
  readonly context: CliContext;
  readonly stdout: string[];
  readonly stderr: string[];
  readonly stores: Map<string, MemoryArtifactStore>;
  readonly designScene: Scene;
  readonly liveScene: Scene;
  readonly logger: RecordingLogger;
  storeFor(directory: string): MemoryArtifactStore;
}

/**
 * A CLI context wired to in-memory doubles.
 *
 * Command behaviour worth testing is the wiring — exit codes, artifact paths, output
 * format — and none of that needs a real browser, service or filesystem.
 */
export function createCliHarness(options: CliHarnessOptions): CliHarness {
  const designScene = buildScene(options.designSpec);
  const liveScene = buildScene(options.liveSpec ?? options.designSpec);
  const live = buildLiveCapture(liveScene);

  const stdout: string[] = [];
  const stderr: string[] = [];
  const stores = new Map<string, MemoryArtifactStore>();
  const logger = new RecordingLogger();

  const configInput: BulwarkConfigInput = {
    name: 'cli-harness',
    target: {
      url: 'http://localhost:4173/',
      viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
    },
    design: { imagePath: 'design.png' },
    services: {
      detector: { kind: 'omniparser', baseUrl: 'http://omniparser:8000' },
      recognizer: { kind: 'ink-projection' },
    },
    output: { runId: 'run-fixed', artifactsDir: '.artifacts' },
    ...options.configOverrides,
  };
  const config = parseConfig(configInput);

  const loaded: LoadedConfig = {
    config,
    configPath: '/project/bulwark.config.json',
    baseDir: '/project',
    designImagePath: '/project/design.png',
    artifactsDir: '/project/.artifacts',
  };

  const files = new Map<string, Uint8Array>([
    ['/project/design.png', designScene.png],
    ...(options.files ?? new Map()),
  ]);

  const context: CliContext = {
    clock: new FixedClock('2026-02-01T12:00:00.000Z', 5),
    ids: new SequentialIdGenerator('run'),
    logger,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
    loadConfig: () => Promise.resolve(loaded),
    readBinaryFile: (path) => {
      const bytes = files.get(path);
      return bytes === undefined
        ? Promise.reject(new Error(`ENOENT: ${path}`))
        : Promise.resolve(bytes);
    },
    createStore: (directory) => {
      const existing = stores.get(directory);
      if (existing !== undefined) return existing;
      const store = new MemoryArtifactStore();
      stores.set(directory, store);
      return store;
    },
    buildServices: () => ({
      detector: FakeElementDetector.bySurface(designScene.detection, liveScene.detection),
      recognizer: new InkProjectionRecognizer(),
      inspector: new FakeLiveInspector(live),
    }),
    cwd: '/project',
  };

  return {
    context,
    stdout,
    stderr,
    stores,
    designScene,
    liveScene,
    logger,
    storeFor: (directory) => {
      const store = stores.get(directory);
      if (store === undefined) throw new Error(`No store was created for ${directory}`);
      return store;
    },
  };
}
