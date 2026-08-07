import { mkdir, mkdtemp, readlink, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FixedClock, InkProjectionRecognizer, SequentialIdGenerator } from '@bulwark/adapters';
import {
  FakeElementDetector,
  FakeLiveInspector,
  RecordingLogger,
  buildLiveCapture,
  buildScene,
} from '@bulwark/adapters/testing';
import type { QaReport } from '@bulwark/domain';
import { REFERENCE_SCENE } from '@bulwark/pipeline/testing';
import { createApiServer, parseDashboardOrigins, updateLatestRunLink } from './index.js';
import type { RunningApiServer } from './index.js';

describe('Bulwark API', () => {
  let root: string;
  let running: RunningApiServer | null = null;
  let baseUrl = '';

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bulwark-api-'));
  });

  afterEach(async () => {
    await running?.close();
    running = null;
    await rm(root, { recursive: true, force: true });
  });

  it('reports health and allows the dashboard origin through CORS', async () => {
    await startServer({ artifactsRoot: root });

    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'http://localhost:5173' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(await response.json()).toEqual({ status: 'ok' });
  });

  it('allows the docker dashboard origin through CORS by default', async () => {
    await startServer({ artifactsRoot: root });

    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { origin: 'http://localhost:8080' },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:8080');
  });

  it('answers CORS preflight requests', async () => {
    await startServer({ artifactsRoot: root });

    const response = await fetch(`${baseUrl}/api/runs`, {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:5173' },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
  });

  it('lists runs and serves reports and PNG artifacts', async () => {
    await writeRun('run-one', sampleReport('run-one', '2026-02-01T12:00:00.000Z'));
    await writeRun('run-two', sampleReport('run-two', '2026-02-01T13:00:00.000Z'));
    await mkdir(join(root, 'run-without-report'), { recursive: true });
    await updateLatestRunLink(root, join(root, 'run-two'));
    await startServer({ artifactsRoot: root });

    const listResponse = await fetch(`${baseUrl}/api/runs`);
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as { runs: Array<{ id: string; status: string }> };
    expect(list.runs.map((run) => run.id)).toContain('run-one');
    expect(list.runs.map((run) => run.id)).not.toContain('latest');
    expect(list.runs.find((run) => run.id === 'run-without-report')).toMatchObject({
      status: 'missing-report',
    });

    const detailResponse = await fetch(`${baseUrl}/api/runs/run-one`);
    expect(detailResponse.status).toBe(200);
    const detail = (await detailResponse.json()) as {
      id: string;
      status: string;
      artifacts: Array<{ file: string; contentType: string }>;
    };
    expect(detail).toMatchObject({ id: 'run-one', status: 'complete' });
    expect(detail.artifacts).toEqual([
      expect.objectContaining({ file: 'figma-screenshot.png', contentType: 'image/png' }),
      expect.objectContaining({ file: 'live-screenshot.png', contentType: 'image/png' }),
    ]);

    const reportResponse = await fetch(`${baseUrl}/api/runs/run-one/report`);
    expect(reportResponse.status).toBe(200);
    expect(reportResponse.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect((await reportResponse.json()) as QaReport).toMatchObject({ runId: 'run-one' });

    const artifactResponse = await fetch(
      `${baseUrl}/api/runs/run-one/artifacts/live-screenshot.png`,
    );
    expect(artifactResponse.status).toBe(200);
    expect(artifactResponse.headers.get('content-type')).toBe('image/png');
    expect(new Uint8Array(await artifactResponse.arrayBuffer())).toEqual(new Uint8Array([4, 5, 6]));
  });

  it('confines run and artifact path parameters to the artifacts root', async () => {
    await writeRun('run-one', sampleReport('run-one', '2026-02-01T12:00:00.000Z'));
    await writeFile(join(root, 'secret.png'), 'do not serve me');
    await startServer({ artifactsRoot: root });

    const artifactResponse = await fetch(
      `${baseUrl}/api/runs/run-one/artifacts/%2e%2e%2fsecret.png`,
    );
    expect(artifactResponse.status).toBe(400);
    expect(await artifactResponse.text()).not.toContain('do not serve me');

    const runResponse = await fetch(`${baseUrl}/api/runs/%2e%2e%2frun-one/report`);
    expect(runResponse.status).toBe(400);
  });

  it('runs a new analysis through the pipeline and writes run artifacts', async () => {
    const configPath = join(root, 'bulwark.config.json');
    const designPath = join(root, 'design.png');
    const designScene = buildScene(REFERENCE_SCENE);
    const liveScene = buildScene(REFERENCE_SCENE);
    await writeFile(designPath, designScene.png);
    await writeFile(
      configPath,
      JSON.stringify({
        name: 'api-test',
        target: {
          url: 'http://localhost:4173/',
          viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
        },
        design: { imagePath: designPath },
        services: {
          detector: { kind: 'omniparser', baseUrl: 'http://omniparser:8000' },
          recognizer: { kind: 'ink-projection' },
        },
        output: { runId: 'api-run', artifactsDir: root },
      }),
    );

    await startServer({
      configPath,
      artifactsRoot: root,
      context: {
        clock: new FixedClock('2026-02-01T12:00:00.000Z', 5),
        ids: new SequentialIdGenerator('api'),
        logger: new RecordingLogger(),
        buildServices: () => ({
          detector: FakeElementDetector.bySurface(designScene.detection, liveScene.detection),
          recognizer: new InkProjectionRecognizer(),
          inspector: new FakeLiveInspector(buildLiveCapture(liveScene)),
        }),
      },
    });

    const response = await fetch(`${baseUrl}/api/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });

    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      run: { id: string; status: string; artifacts: Array<{ file: string }> };
      report: QaReport;
    };
    expect(payload.run).toMatchObject({ id: 'api-run', status: 'complete' });
    expect(payload.run.artifacts.map((artifact) => artifact.file)).toEqual([
      'figma-screenshot.png',
      'live-screenshot.png',
    ]);
    expect(payload.report.summary.passed).toBe(true);
    expect(await readlink(join(root, 'latest'))).toBe('api-run');

    const reportResponse = await fetch(`${baseUrl}/api/runs/api-run/report`);
    expect(reportResponse.status).toBe(200);
    expect((await reportResponse.json()) as QaReport).toMatchObject({
      runId: 'api-run',
      summary: { passed: true },
    });
  });

  it('validates POST bodies before starting a run', async () => {
    await startServer({ artifactsRoot: root });

    const response = await fetch(`${baseUrl}/api/runs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"unexpected":true}',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { code: 'bad-request' },
    });
  });

  async function startServer(options: Parameters<typeof createApiServer>[0]): Promise<void> {
    const created = createApiServer({
      configPath: join(root, 'missing-config.json'),
      port: 0,
      host: '127.0.0.1',
      ...options,
    });
    running = await created.listen();
    baseUrl = `http://127.0.0.1:${running.port}`;
  }

  async function writeRun(runId: string, report: QaReport): Promise<void> {
    const directory = join(root, runId);
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'report.json'), JSON.stringify(report));
    await writeFile(join(directory, 'figma-screenshot.png'), new Uint8Array([1, 2, 3]));
    await writeFile(join(directory, 'live-screenshot.png'), new Uint8Array([4, 5, 6]));
  }
});

describe('parseDashboardOrigins', () => {
  it('splits a comma-separated list and falls back when empty', () => {
    expect(parseDashboardOrigins('http://a.example, http://b.example')).toEqual([
      'http://a.example',
      'http://b.example',
    ]);
    expect(parseDashboardOrigins('  ,  ')).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ]);
  });
});

describe('updateLatestRunLink', () => {
  it('rewrites the latest symlink to the newest run directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'bulwark-latest-'));
    try {
      await mkdir(join(root, 'run-a'), { recursive: true });
      await mkdir(join(root, 'run-b'), { recursive: true });
      await updateLatestRunLink(root, join(root, 'run-a'));
      expect(await readlink(join(root, 'latest'))).toBe('run-a');
      await updateLatestRunLink(root, join(root, 'run-b'));
      expect(await readlink(join(root, 'latest'))).toBe('run-b');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

function sampleReport(runId: string, generatedAt: string): QaReport {
  return {
    schemaVersion: 1,
    runId,
    generatedAt,
    target: {
      url: 'http://localhost:4173/',
      viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
    },
    surfaces: {
      design: { imagePath: 'figma-screenshot.png', width: 800, height: 600, imageSha256: 'a' },
      live: { imagePath: 'live-screenshot.png', width: 800, height: 600, imageSha256: 'b' },
    },
    tolerances: { spacingPx: 2, positionPx: 2, fontSizePx: 1, deltaE: 2, minFamilyMargin: 0.02 },
    summary: {
      passed: true,
      totalDefects: 0,
      bySeverity: {},
      byType: {},
      designElementCount: 4,
      liveElementCount: 4,
      matchedElementCount: 4,
      matchRate: 1,
    },
    defects: [],
    measurements: {
      designElements: [],
      liveElements: [],
      pairs: [],
      spacing: [],
      typography: [],
      colors: [],
    },
    diagnostics: {
      warnings: [],
      detector: 'fake-detector',
      textRecognizer: 'fake-recognizer',
      durationMs: 5,
    },
  };
}
