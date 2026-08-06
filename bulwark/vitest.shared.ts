import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';

/**
 * Workspace packages resolve to their TypeScript sources during tests.
 *
 * Without this, running a test would require building every dependency first, and
 * coverage would report on emitted JavaScript instead of the code under review.
 */
export const workspaceAliases: Record<string, string> = {
  '@bulwark/domain': resolveFromRoot('packages/domain/src/index.ts'),
  '@bulwark/imaging': resolveFromRoot('packages/imaging/src/index.ts'),
  '@bulwark/ports': resolveFromRoot('packages/ports/src/index.ts'),
  '@bulwark/adapters/testing': resolveFromRoot('packages/adapters/src/testing/index.ts'),
  '@bulwark/adapters': resolveFromRoot('packages/adapters/src/index.ts'),
  '@bulwark/pipeline/testing': resolveFromRoot('packages/pipeline/src/testing/index.ts'),
  '@bulwark/pipeline': resolveFromRoot('packages/pipeline/src/index.ts'),
};

export interface ProjectTestConfigOptions {
  readonly name: string;
  readonly environment?: 'node' | 'jsdom';
  readonly include?: readonly string[];
  readonly setupFiles?: readonly string[];
}

export function projectTestConfig(options: ProjectTestConfigOptions): ViteUserConfig {
  return {
    resolve: { alias: workspaceAliases },
    test: {
      name: options.name,
      environment: options.environment ?? 'node',
      include: [...(options.include ?? ['src/**/*.test.ts'])],
      ...(options.setupFiles === undefined ? {} : { setupFiles: [...options.setupFiles] }),
    },
  };
}

function resolveFromRoot(relativePath: string): string {
  return fileURLToPath(new URL(relativePath, import.meta.url));
}
