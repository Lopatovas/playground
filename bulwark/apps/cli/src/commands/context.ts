import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ConsoleLogger,
  FilesystemArtifactStore,
  SystemClock,
  UuidIdGenerator,
} from '@bulwark/adapters';
import type { ArtifactStore, Clock, IdGenerator, Logger } from '@bulwark/ports';
import { QaEngine, QaRunner, buildServices } from '@bulwark/pipeline';
import type { BuiltServices } from '@bulwark/pipeline';
import type { LoadedConfig } from '../config-loader.js';
import { loadConfig, runDirectoryName } from '../config-loader.js';

/**
 * Everything a command needs from the outside world.
 *
 * Commands take this as an argument instead of reaching for `process` or `console`
 * themselves, which is what lets each one be tested without spawning a process or
 * capturing global output.
 */
export interface CliContext {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
  readonly stdout: (line: string) => void;
  readonly stderr: (line: string) => void;
  readonly loadConfig: (path: string) => Promise<LoadedConfig>;
  readonly readBinaryFile: (path: string) => Promise<Uint8Array>;
  readonly createStore: (directory: string) => ArtifactStore;
  readonly buildServices: (config: LoadedConfig) => BuiltServices;
  readonly cwd: string;
}

export function createDefaultContext(overrides: Partial<CliContext> = {}): CliContext {
  return {
    clock: new SystemClock(),
    ids: new UuidIdGenerator(),
    logger: new ConsoleLogger(process.env['BULWARK_LOG_LEVEL'] === 'debug' ? 'debug' : 'info'),
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
    loadConfig: (path) => loadConfig(path),
    readBinaryFile: async (path) => new Uint8Array(await readFile(path)),
    createStore: (directory) => new FilesystemArtifactStore(directory),
    buildServices: (loaded) =>
      buildServices({
        ...loaded.config,
        services: {
          ...loaded.config.services,
          ...(loaded.cacheDir === undefined ? {} : { cacheDir: loaded.cacheDir }),
        },
      }),
    cwd: process.cwd(),
    ...overrides,
  };
}

export interface PreparedRun {
  readonly loaded: LoadedConfig;
  readonly services: BuiltServices;
  readonly store: ArtifactStore;
  readonly engine: QaEngine;
  readonly runner: QaRunner;
  readonly runDirectory: string;
}

/** Builds the engine, runner and run directory for one invocation. */
export async function prepareRun(context: CliContext, configPath: string): Promise<PreparedRun> {
  const loaded = await context.loadConfig(configPath);
  const services = context.buildServices(loaded);
  const runDirectory = join(
    loaded.artifactsDir,
    runDirectoryName(loaded.config.output.runId, context.clock.nowIso()),
  );
  const store = context.createStore(runDirectory);

  const engine = new QaEngine(
    {
      detector: services.detector,
      recognizer: services.recognizer,
      ...(services.rasterizer === undefined ? {} : { rasterizer: services.rasterizer }),
      clock: context.clock,
      ids: context.ids,
      logger: context.logger,
    },
    loaded.config,
  );

  const runner = new QaRunner(
    {
      engine,
      inspector: services.inspector,
      store,
      logger: context.logger,
      readDesignImage: () => context.readBinaryFile(loaded.designImagePath),
    },
    loaded.config,
  );

  return { loaded, services, store, engine, runner, runDirectory };
}
