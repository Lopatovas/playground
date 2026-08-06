import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

export interface StaticMount {
  /** URL prefix, e.g. `/artifacts`. Use `/` for the root mount. */
  readonly prefix: string;
  readonly directory: string;
  /** Serve `index.html` for unknown paths, for a single-page dashboard. */
  readonly spaFallback?: boolean;
}

export function contentTypeFor(path: string): string {
  return CONTENT_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

/**
 * Resolves a URL path inside a mount directory.
 *
 * Returns null when the result would escape the directory. The dashboard is handed a
 * run directory that can sit anywhere, and a `..` in a request must not turn a local
 * preview server into a file browser.
 */
export function resolveWithinDirectory(directory: string, urlPath: string): string | null {
  const decoded = safeDecode(urlPath);
  if (decoded === null) return null;
  if (decoded.includes('\0')) return null;

  const root = resolve(directory);
  const target = resolve(root, `.${normalize(decoded)}`);
  const rootWithSep = root.endsWith(sep) ? root : `${root}${sep}`;
  if (target !== root && !target.startsWith(rootWithSep)) return null;
  return target;
}

export interface StaticServerOptions {
  readonly mounts: readonly StaticMount[];
  readonly port: number;
  readonly host?: string;
}

export interface RunningServer {
  readonly port: number;
  close(): Promise<void>;
}

/**
 * A minimal read-only static file server for previewing a run locally.
 *
 * Deliberately not a dependency: the production stack serves these files through
 * nginx, and this exists so `bulwark serve` works with nothing installed.
 */
export function createStaticServer(options: StaticServerOptions): {
  server: Server;
  listen(): Promise<RunningServer>;
} {
  const mounts = [...options.mounts].sort((a, b) => b.prefix.length - a.prefix.length);

  const server = createServer((request, response) => {
    void (async () => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { allow: 'GET, HEAD' }).end('Method Not Allowed');
        return;
      }

      const urlPath = new URL(request.url ?? '/', 'http://localhost').pathname;
      const mount = mounts.find((candidate) => matchesPrefix(urlPath, candidate.prefix));
      if (mount === undefined) {
        response.writeHead(404).end('Not Found');
        return;
      }

      const relativePath = stripPrefix(urlPath, mount.prefix);
      const filePath = resolveWithinDirectory(mount.directory, relativePath);
      if (filePath === null) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      const resolved = await resolveFile(filePath, mount);
      if (resolved === null) {
        response.writeHead(404).end('Not Found');
        return;
      }

      response.writeHead(200, {
        'content-type': contentTypeFor(resolved),
        'cache-control': 'no-store',
      });
      if (request.method === 'HEAD') {
        response.end();
        return;
      }
      createReadStream(resolved).pipe(response);
    })().catch(() => {
      if (!response.headersSent) response.writeHead(500);
      response.end('Internal Server Error');
    });
  });

  return {
    server,
    listen: () =>
      new Promise<RunningServer>((resolvePromise, rejectPromise) => {
        server.once('error', rejectPromise);
        server.listen(options.port, options.host ?? '0.0.0.0', () => {
          const address = server.address();
          const port = typeof address === 'object' && address !== null ? address.port : options.port;
          resolvePromise({
            port,
            close: () =>
              new Promise<void>((done, fail) => {
                server.close((error) => (error === undefined ? done() : fail(error)));
              }),
          });
        });
      }),
  };
}

async function resolveFile(filePath: string, mount: StaticMount): Promise<string | null> {
  const direct = await statOrNull(filePath);
  if (direct?.isFile() === true) return filePath;

  if (direct?.isDirectory() === true) {
    const index = join(filePath, 'index.html');
    if ((await statOrNull(index))?.isFile() === true) return index;
  }

  if (mount.spaFallback === true) {
    const index = join(resolve(mount.directory), 'index.html');
    if ((await statOrNull(index))?.isFile() === true) return index;
  }

  return null;
}

async function statOrNull(path: string) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

function matchesPrefix(urlPath: string, prefix: string): boolean {
  if (prefix === '/') return true;
  return urlPath === prefix || urlPath.startsWith(`${prefix}/`);
}

function stripPrefix(urlPath: string, prefix: string): string {
  if (prefix === '/') return urlPath;
  const remainder = urlPath.slice(prefix.length);
  return remainder.length === 0 ? '/' : remainder;
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
