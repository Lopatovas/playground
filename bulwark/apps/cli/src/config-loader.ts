import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { ConfigurationError } from '@bulwark/ports';
import type { BulwarkConfig } from '@bulwark/pipeline';
import { parseConfig } from '@bulwark/pipeline';

export const DEFAULT_CONFIG_FILENAME = 'bulwark.config.json';

export interface LoadedConfig {
  readonly config: BulwarkConfig;
  readonly configPath: string;
  /** Directory paths in the config are resolved against. */
  readonly baseDir: string;
  /** Absolute path to the design export. */
  readonly designImagePath: string;
  /** Absolute path to the artifacts root. */
  readonly artifactsDir: string;
  /** Absolute path to the response cache, when one is configured. */
  readonly cacheDir?: string;
}

export type ReadTextFile = (path: string) => Promise<string>;

/**
 * Loads and validates a configuration file.
 *
 * Relative paths inside the file resolve against the file's own directory rather than
 * the working directory, so `bulwark run -c ../design-qa/bulwark.config.json` behaves
 * the same from anywhere in the repository.
 */
export async function loadConfig(
  configPath: string,
  readTextFile: ReadTextFile = (path) => readFile(path, 'utf8'),
): Promise<LoadedConfig> {
  const absolutePath = resolve(configPath);
  let raw: string;
  try {
    raw = await readTextFile(absolutePath);
  } catch (error) {
    throw new ConfigurationError(
      `Could not read the configuration file at "${absolutePath}". ` +
        `Create one with "bulwark init".`,
      { configPath: absolutePath },
      { cause: error },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new ConfigurationError(
      `The configuration file at "${absolutePath}" is not valid JSON`,
      { configPath: absolutePath },
      { cause: error },
    );
  }

  const config = parseConfig(parsed);
  const baseDir = dirname(absolutePath);

  return {
    config,
    configPath: absolutePath,
    baseDir,
    designImagePath: resolveAgainst(baseDir, config.design.imagePath),
    artifactsDir: resolveAgainst(baseDir, config.output.artifactsDir),
    ...(config.services.cacheDir === undefined
      ? {}
      : { cacheDir: resolveAgainst(baseDir, config.services.cacheDir) }),
  };
}

export function resolveAgainst(baseDir: string, path: string): string {
  return isAbsolute(path) ? path : resolve(baseDir, path);
}

/**
 * Directory for one run's artifacts.
 *
 * A configured run id wins, which is what CI wants for a predictable path; otherwise
 * the timestamp keeps successive runs side by side instead of overwriting each other.
 */
export function runDirectoryName(runId: string | undefined, nowIso: string): string {
  if (runId !== undefined) return runId;
  return nowIso.replace(/[:.]/g, '-').replace(/Z$/, 'Z');
}
