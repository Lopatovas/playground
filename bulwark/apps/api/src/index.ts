import { createReadStream } from 'node:fs';
import { readFile, readdir, rename, rm, stat, symlink } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { basename, dirname, extname, isAbsolute, join, normalize, resolve, sep } from 'node:path';
import {
  ConsoleLogger,
  FilesystemArtifactStore,
  SystemClock,
  UuidIdGenerator,
} from '@bulwark/adapters';
import type { QaReport } from '@bulwark/domain';
import type { ArtifactStore, Clock, IdGenerator, Logger } from '@bulwark/ports';
import {
  BulwarkError,
  ConfigurationError,
  MissingArtifactError,
  ServiceError,
} from '@bulwark/ports';
import {
  QaEngine,
  QaRunner,
  REPORT_ARTIFACT_PATH,
  buildServices,
  parseConfig,
} from '@bulwark/pipeline';
import type { BuiltServices, BulwarkConfig } from '@bulwark/pipeline';

const DEFAULT_CONFIG_FILENAME = 'bulwark.config.json';
const DEFAULT_PORT = 4190;
const MAX_JSON_BODY_BYTES = 64 * 1024;
const LATEST_RUN_LINK = 'latest';
const DEFAULT_DASHBOARD_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

export interface LoadedConfig {
  readonly config: BulwarkConfig;
  readonly configPath: string;
  readonly baseDir: string;
  readonly designImagePath: string;
  readonly artifactsDir: string;
  readonly cacheDir?: string;
}

export interface ApiContext {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly logger: Logger;
  readonly readTextFile: (path: string) => Promise<string>;
  readonly readBinaryFile: (path: string) => Promise<Uint8Array>;
  readonly createStore: (directory: string) => ArtifactStore;
  readonly buildServices: (config: LoadedConfig) => BuiltServices;
  readonly linkLatestRun: (artifactsRoot: string, runDirectory: string) => Promise<void>;
  readonly cwd: string;
}

export interface ApiServerOptions {
  readonly configPath: string;
  readonly artifactsRoot?: string;
  readonly port?: number;
  readonly host?: string;
  readonly dashboardOrigins?: readonly string[];
  readonly context?: Partial<ApiContext>;
}

export interface RunningApiServer {
  readonly port: number;
  close(): Promise<void>;
}

export interface RunArtifact {
  readonly file: string;
  readonly url: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

export interface RunRecord {
  readonly id: string;
  readonly status: 'complete' | 'missing-report' | 'invalid-report';
  readonly generatedAt?: string;
  readonly updatedAt?: string;
  readonly reportUrl: string;
  readonly artifactsUrl: string;
  readonly summary?: QaReport['summary'];
  readonly target?: QaReport['target'];
  readonly artifacts?: readonly RunArtifact[];
}

interface PreparedRun {
  readonly loaded: LoadedConfig;
  readonly services: BuiltServices;
  readonly store: ArtifactStore;
  readonly engine: QaEngine;
  readonly runner: QaRunner;
  readonly runDirectory: string;
}

interface RouteContext {
  readonly context: ApiContext;
  readonly configPath: string;
  readonly artifactsRoot?: string;
  readonly dashboardOrigins: readonly string[];
}

export function createDefaultApiContext(overrides: Partial<ApiContext> = {}): ApiContext {
  return {
    clock: new SystemClock(),
    ids: new UuidIdGenerator(),
    logger: new ConsoleLogger(process.env['BULWARK_LOG_LEVEL'] === 'debug' ? 'debug' : 'info'),
    readTextFile: (path) => readFile(path, 'utf8'),
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
    linkLatestRun: updateLatestRunLink,
    cwd: process.cwd(),
    ...overrides,
  };
}

export function createApiServer(options: ApiServerOptions): {
  readonly server: Server;
  listen(): Promise<RunningApiServer>;
} {
  const context = createDefaultApiContext(options.context);
  const routeContext: RouteContext = {
    context,
    configPath: options.configPath,
    ...(options.artifactsRoot === undefined
      ? {}
      : { artifactsRoot: resolveAgainst(context.cwd, options.artifactsRoot) }),
    dashboardOrigins: options.dashboardOrigins ?? DEFAULT_DASHBOARD_ORIGINS,
  };

  const server = createServer((request, response) => {
    void handleRequest(routeContext, request, response).catch((error) => {
      context.logger.log('error', 'api request failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      if (!response.headersSent) {
        sendError(
          routeContext,
          request,
          response,
          statusForError(error),
          codeForError(error),
          messageForError(error),
        );
        return;
      }
      response.end();
    });
  });

  return {
    server,
    listen: () =>
      new Promise<RunningApiServer>((resolvePromise, rejectPromise) => {
        server.once('error', rejectPromise);
        server.listen(options.port ?? DEFAULT_PORT, options.host ?? '0.0.0.0', () => {
          server.off('error', rejectPromise);
          const address = server.address();
          const port =
            typeof address === 'object' && address !== null
              ? address.port
              : (options.port ?? DEFAULT_PORT);
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

export async function loadConfig(
  context: ApiContext,
  configPath: string,
  artifactsRootOverride?: string,
): Promise<LoadedConfig> {
  const absolutePath = resolveAgainst(context.cwd, configPath);
  let raw: string;
  try {
    raw = await context.readTextFile(absolutePath);
  } catch (error) {
    throw new ConfigurationError(
      `Could not read the configuration file at "${absolutePath}". Create one with "bulwark init".`,
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
      {
        configPath: absolutePath,
      },
      { cause: error },
    );
  }

  const config = parseConfig(parsed);
  const baseDir = dirname(absolutePath);
  const artifactsDir =
    artifactsRootOverride === undefined
      ? resolveAgainst(baseDir, config.output.artifactsDir)
      : resolveAgainst(context.cwd, artifactsRootOverride);

  return {
    config,
    configPath: absolutePath,
    baseDir,
    designImagePath: resolveAgainst(baseDir, config.design.imagePath),
    artifactsDir,
    ...(config.services.cacheDir === undefined
      ? {}
      : { cacheDir: resolveAgainst(baseDir, config.services.cacheDir) }),
  };
}

export async function prepareRun(
  context: ApiContext,
  configPath: string,
  artifactsRootOverride?: string,
): Promise<PreparedRun> {
  const loaded = await loadConfig(context, configPath, artifactsRootOverride);
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

export function runDirectoryName(runId: string | undefined, nowIso: string): string {
  if (runId !== undefined) return runId;
  return nowIso.replace(/[:.]/g, '-').replace(/Z$/, 'Z');
}

/**
 * Points `artifactsRoot/latest` at the newest run directory.
 *
 * Nginx serves `/artifacts/` from that link so the overlay dashboard can open
 * the most recent report without knowing the run id.
 */
export async function updateLatestRunLink(
  artifactsRoot: string,
  runDirectory: string,
): Promise<void> {
  const root = resolve(artifactsRoot);
  const targetName = basename(runDirectory);
  if (targetName.length === 0 || targetName === '.' || targetName === '..') {
    throw new BulwarkError('Cannot link latest run to an empty directory name', { runDirectory });
  }
  if (targetName === LATEST_RUN_LINK) {
    throw new BulwarkError('Run directory must not be named "latest"', { runDirectory });
  }

  const latestPath = join(root, LATEST_RUN_LINK);
  const tempPath = join(root, `.${LATEST_RUN_LINK}.${process.pid}.tmp`);
  await rm(tempPath, { force: true, recursive: true });
  await symlink(targetName, tempPath);
  try {
    await rename(tempPath, latestPath);
  } catch {
    await rm(tempPath, { force: true, recursive: true }).catch(() => undefined);
    // Replace a leftover directory or broken link from an older layout.
    await rm(latestPath, { force: true, recursive: true });
    await symlink(targetName, latestPath);
  }
}

export function parseDashboardOrigins(
  raw: string | undefined,
  fallback: readonly string[] = DEFAULT_DASHBOARD_ORIGINS,
): readonly string[] {
  if (raw === undefined || raw.trim() === '') return fallback;
  const origins = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return origins.length === 0 ? fallback : origins;
}

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

export async function main(
  argv: readonly string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  void argv;
  const port = parsePort(env['PORT']);
  const configPath = env['BULWARK_CONFIG'] ?? DEFAULT_CONFIG_FILENAME;
  const artifactsRoot = env['BULWARK_ARTIFACTS_DIR'];
  const { listen } = createApiServer({
    configPath,
    ...(artifactsRoot === undefined ? {} : { artifactsRoot }),
    port,
    dashboardOrigins: parseDashboardOrigins(env['BULWARK_DASHBOARD_ORIGINS']),
  });
  const running = await listen();
  process.stderr.write(`Bulwark API listening on http://0.0.0.0:${running.port}\n`);
}

async function handleRequest(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  applyCorsHeaders(routeContext, request, response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      allow: 'GET, HEAD, POST, OPTIONS',
      'access-control-allow-methods': 'GET, HEAD, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '600',
    });
    response.end();
    return;
  }

  const method = request.method ?? 'GET';
  const url = new URL(request.url ?? '/', 'http://localhost');
  const path = url.pathname;

  if (path === '/api/health') {
    if (!allowMethod(routeContext, request, response, ['GET', 'HEAD'])) return;
    sendJson(routeContext, request, response, 200, { status: 'ok' });
    return;
  }

  if (path === '/api/runs') {
    if (method === 'GET' || method === 'HEAD') {
      const artifactsRoot = await resolveArtifactsRoot(routeContext);
      const runs = await listRuns(artifactsRoot);
      sendJson(routeContext, request, response, 200, { runs });
      return;
    }
    if (method === 'POST') {
      await readRunRequestBody(request);
      const prepared = await prepareRun(
        routeContext.context,
        routeContext.configPath,
        routeContext.artifactsRoot,
      );
      const result = await prepared.runner.run();
      await routeContext.context.linkLatestRun(prepared.loaded.artifactsDir, prepared.runDirectory);
      const run = await readRunRecord(
        prepared.loaded.artifactsDir,
        basename(prepared.runDirectory),
        true,
      );
      sendJson(routeContext, request, response, 201, { run, report: result.report });
      return;
    }
    sendMethodNotAllowed(routeContext, request, response, ['GET', 'HEAD', 'POST']);
    return;
  }

  const reportMatch = /^\/api\/runs\/([^/]+)\/report$/.exec(path);
  if (reportMatch !== null) {
    if (!allowMethod(routeContext, request, response, ['GET', 'HEAD'])) return;
    const run = parseRouteSegment(reportMatch[1] ?? '', 'run id');
    const artifactsRoot = await resolveArtifactsRoot(routeContext);
    const reportPath = resolveRunFile(artifactsRoot, run, REPORT_ARTIFACT_PATH);
    await sendFile(routeContext, request, response, reportPath, contentTypeFor(reportPath));
    return;
  }

  const artifactMatch = /^\/api\/runs\/([^/]+)\/artifacts\/([^/]+)$/.exec(path);
  if (artifactMatch !== null) {
    if (!allowMethod(routeContext, request, response, ['GET', 'HEAD'])) return;
    const run = parseRouteSegment(artifactMatch[1] ?? '', 'run id');
    const file = parseRouteSegment(artifactMatch[2] ?? '', 'artifact file');
    if (extname(file).toLowerCase() !== '.png') {
      throw new BulwarkError('Only PNG artifacts can be served from this route', { file });
    }
    const artifactsRoot = await resolveArtifactsRoot(routeContext);
    const artifactPath = resolveRunFile(artifactsRoot, run, file);
    await sendFile(routeContext, request, response, artifactPath, 'image/png');
    return;
  }

  const runMatch = /^\/api\/runs\/([^/]+)$/.exec(path);
  if (runMatch !== null) {
    if (!allowMethod(routeContext, request, response, ['GET', 'HEAD'])) return;
    const run = parseRouteSegment(runMatch[1] ?? '', 'run id');
    const artifactsRoot = await resolveArtifactsRoot(routeContext);
    if (!(await isDirectory(resolveRunDirectory(artifactsRoot, run)))) {
      sendError(routeContext, request, response, 404, 'not-found', `Run "${run}" was not found`);
      return;
    }
    sendJson(routeContext, request, response, 200, await readRunRecord(artifactsRoot, run, true));
    return;
  }

  sendError(routeContext, request, response, 404, 'not-found', 'Not Found');
}

async function resolveArtifactsRoot(routeContext: RouteContext): Promise<string> {
  if (routeContext.artifactsRoot !== undefined) return routeContext.artifactsRoot;
  const loaded = await loadConfig(routeContext.context, routeContext.configPath);
  return loaded.artifactsDir;
}

async function listRuns(artifactsRoot: string): Promise<readonly RunRecord[]> {
  let entries;
  try {
    entries = await readdir(artifactsRoot, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return [];
    throw error;
  }

  const runs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name !== LATEST_RUN_LINK)
      .map((entry) => readRunRecord(artifactsRoot, entry.name, false)),
  );

  return runs.sort((a, b) => {
    const aTime = Date.parse(a.generatedAt ?? a.updatedAt ?? '');
    const bTime = Date.parse(b.generatedAt ?? b.updatedAt ?? '');
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });
}

async function readRunRecord(
  artifactsRoot: string,
  runId: string,
  includeArtifacts: boolean,
): Promise<RunRecord> {
  const runDirectory = resolveRunDirectory(artifactsRoot, runId);
  const reportPath = resolveRunFile(artifactsRoot, runId, REPORT_ARTIFACT_PATH);
  const reportStat = await statOrNull(reportPath);
  const base = {
    id: runId,
    reportUrl: `/api/runs/${encodeURIComponent(runId)}/report`,
    artifactsUrl: `/api/runs/${encodeURIComponent(runId)}/artifacts/`,
    ...(reportStat === null ? {} : { updatedAt: reportStat.mtime.toISOString() }),
  };

  let rawReport: string;
  try {
    rawReport = await readFile(reportPath, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return { ...base, status: 'missing-report' };
    }
    throw error;
  }

  let report: QaReport;
  try {
    report = JSON.parse(rawReport) as QaReport;
  } catch {
    return { ...base, status: 'invalid-report' };
  }

  return {
    ...base,
    status: 'complete',
    ...(typeof report.generatedAt === 'string' ? { generatedAt: report.generatedAt } : {}),
    ...(report.summary === undefined ? {} : { summary: report.summary }),
    ...(report.target === undefined ? {} : { target: report.target }),
    ...(includeArtifacts ? { artifacts: await listPngArtifacts(runDirectory, runId) } : {}),
  };
}

async function listPngArtifacts(
  runDirectory: string,
  runId: string,
): Promise<readonly RunArtifact[]> {
  let entries;
  try {
    entries = await readdir(runDirectory, { withFileTypes: true });
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') return [];
    throw error;
  }

  const artifacts = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === '.png')
      .map(async (entry): Promise<RunArtifact> => {
        const filePath = join(runDirectory, entry.name);
        const fileStat = await stat(filePath);
        return {
          file: entry.name,
          url: `/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(entry.name)}`,
          contentType: 'image/png',
          sizeBytes: fileStat.size,
        };
      }),
  );

  return artifacts.sort((a, b) => a.file.localeCompare(b.file));
}

function resolveRunDirectory(artifactsRoot: string, runId: string): string {
  const directory = resolveWithinDirectory(artifactsRoot, `/${runId}`);
  if (directory === null)
    throw new BulwarkError('Run id escapes the artifacts directory', { runId });
  return directory;
}

function resolveRunFile(artifactsRoot: string, runId: string, file: string): string {
  const directory = resolveRunDirectory(artifactsRoot, runId);
  const target = resolveWithinDirectory(directory, `/${file}`);
  if (target === null)
    throw new BulwarkError('Artifact path escapes the run directory', { runId, file });
  return target;
}

async function readRunRequestBody(request: IncomingMessage): Promise<void> {
  const contentType = request.headers['content-type'];
  const chunks: Buffer[] = [];
  let bytes = 0;

  for await (const chunk of request) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    bytes += buffer.byteLength;
    if (bytes > MAX_JSON_BODY_BYTES) {
      throw new BulwarkError('Request body is too large', { limitBytes: MAX_JSON_BODY_BYTES });
    }
    chunks.push(buffer);
  }

  if (bytes === 0) return;
  if (typeof contentType !== 'string' || !contentType.toLowerCase().includes('application/json')) {
    throw new BulwarkError('POST /api/runs accepts application/json bodies only');
  }

  let parsed: unknown;
  const text = Buffer.concat(chunks).toString('utf8').trim();
  if (text.length === 0) return;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new BulwarkError('Request body is not valid JSON', {}, { cause: error });
  }

  if (!isRecord(parsed)) {
    throw new BulwarkError('Request body must be a JSON object');
  }
  const keys = Object.keys(parsed);
  if (keys.length > 0) {
    throw new BulwarkError('POST /api/runs does not accept request fields yet', { fields: keys });
  }
}

function parseRouteSegment(value: string, label: string): string {
  const decoded = safeDecode(value);
  if (
    decoded === null ||
    decoded.length === 0 ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('/') ||
    decoded.includes('\\') ||
    decoded.includes('\0')
  ) {
    throw new BulwarkError(`Invalid ${label}`, { value });
  }
  return decoded;
}

async function sendFile(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
  filePath: string,
  contentType: string,
): Promise<void> {
  const fileStat = await statOrNull(filePath);
  if (fileStat === null || !fileStat.isFile()) {
    sendError(routeContext, request, response, 404, 'not-found', 'Artifact was not found');
    return;
  }

  response.writeHead(200, {
    'content-type': contentType,
    'cache-control': 'no-store',
    ...corsHeaders(routeContext, request),
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  await new Promise<void>((resolvePromise, rejectPromise) => {
    const stream = createReadStream(filePath);
    stream.once('error', rejectPromise);
    stream.once('end', resolvePromise);
    stream.pipe(response);
  });
}

function sendJson(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  payload: unknown,
): void {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...corsHeaders(routeContext, request),
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

function sendError(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  sendJson(routeContext, request, response, status, { error: { code, message } });
}

function sendMethodNotAllowed(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
  methods: readonly string[],
): void {
  response.setHeader('allow', methods.join(', '));
  sendError(routeContext, request, response, 405, 'method-not-allowed', 'Method Not Allowed');
}

function allowMethod(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
  methods: readonly string[],
): boolean {
  if (methods.includes(request.method ?? 'GET')) return true;
  sendMethodNotAllowed(routeContext, request, response, methods);
  return false;
}

function applyCorsHeaders(
  routeContext: RouteContext,
  request: IncomingMessage,
  response: ServerResponse,
): void {
  for (const [header, value] of Object.entries(corsHeaders(routeContext, request))) {
    response.setHeader(header, value);
  }
}

function corsHeaders(routeContext: RouteContext, request: IncomingMessage): Record<string, string> {
  const origin = request.headers.origin;
  if (typeof origin !== 'string') return {};
  if (!routeContext.dashboardOrigins.includes(origin)) return { vary: 'origin' };
  return {
    vary: 'origin',
    'access-control-allow-origin': origin,
  };
}

function statusForError(error: unknown): number {
  if (error instanceof ConfigurationError) return 400;
  if (error instanceof MissingArtifactError) return 404;
  if (error instanceof ServiceError) return 502;
  if (error instanceof BulwarkError) return 400;
  return 500;
}

function codeForError(error: unknown): string {
  if (error instanceof ConfigurationError) return 'invalid-config';
  if (error instanceof MissingArtifactError) return 'not-found';
  if (error instanceof ServiceError) return 'service-error';
  if (error instanceof BulwarkError) return 'bad-request';
  return 'internal-error';
}

function messageForError(error: unknown): string {
  if (error instanceof BulwarkError) return error.message;
  return 'Internal Server Error';
}

function contentTypeFor(path: string): string {
  return CONTENT_TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

async function isDirectory(path: string): Promise<boolean> {
  return (await statOrNull(path))?.isDirectory() === true;
}

async function statOrNull(path: string) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

function resolveAgainst(baseDir: string, path: string): string {
  return isAbsolute(path) ? path : resolve(baseDir, path);
}

function safeDecode(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_PORT;
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new ConfigurationError('PORT must be an integer between 1 and 65535', { value: raw });
  }
  return port;
}
