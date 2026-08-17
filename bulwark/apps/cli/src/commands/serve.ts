import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { CliContext } from './context.js';
import { createStaticServer } from '../static-server.js';
import type { RunningServer, StaticMount } from '../static-server.js';

export interface ServeCommandOptions {
  /** Run directory holding report.json and both screenshots. */
  readonly runDirectory: string;
  /** Built dashboard directory; omitted serves the artifacts alone. */
  readonly dashboardDirectory?: string;
  readonly port: number;
  readonly host?: string;
  /** Resolve immediately instead of waiting for a signal; used by tests. */
  readonly detach?: boolean;
}

export interface ServeResult {
  readonly exitCode: number;
  readonly server?: RunningServer;
}

/**
 * Serves one run's artifacts, and the overlay dashboard when it is built.
 *
 * The dashboard is a static bundle that reads `report.json` and the two PNGs over
 * HTTP, so previewing a run needs nothing more than a file server — and the same
 * bundle is what nginx serves in the Docker stack.
 */
export async function serveCommand(
  context: CliContext,
  options: ServeCommandOptions,
): Promise<ServeResult> {
  const runDirectory = resolve(options.runDirectory);
  if (!(await isDirectory(runDirectory))) {
    context.stderr(`No run directory at ${runDirectory}. Run "bulwark run" first.`);
    return { exitCode: 1 };
  }

  const mounts: StaticMount[] = [{ prefix: '/artifacts', directory: runDirectory }];
  const dashboardDirectory =
    options.dashboardDirectory === undefined ? undefined : resolve(options.dashboardDirectory);

  if (dashboardDirectory !== undefined && (await isDirectory(dashboardDirectory))) {
    mounts.push({ prefix: '/', directory: dashboardDirectory, spaFallback: true });
  } else {
    if (dashboardDirectory !== undefined) {
      context.stderr(`No dashboard build at ${dashboardDirectory}; serving artifacts only.`);
    }
    mounts.push({ prefix: '/', directory: runDirectory });
  }

  const { listen } = createStaticServer({
    mounts,
    port: options.port,
    ...(options.host === undefined ? {} : { host: options.host }),
  });
  const server = await listen();

  context.stdout(`serving ${runDirectory} on http://localhost:${server.port}`);
  context.stdout(`  report: http://localhost:${server.port}/artifacts/report.json`);
  if (dashboardDirectory !== undefined) {
    context.stdout(`  overlay: http://localhost:${server.port}/`);
  }

  if (options.detach === true) return { exitCode: 0, server };

  await new Promise<void>((resolvePromise) => {
    const stop = (): void => {
      void server.close().then(resolvePromise);
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });

  return { exitCode: 0 };
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}
