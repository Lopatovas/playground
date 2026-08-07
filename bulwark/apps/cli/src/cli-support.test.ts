import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ConfigurationError } from '@bulwark/ports';
import {
  DEFAULT_CONFIG_FILENAME,
  loadConfig,
  resolveAgainst,
  runDirectoryName,
} from './config-loader.js';
import { contentTypeFor, createStaticServer, resolveWithinDirectory } from './static-server.js';
import { formatDefectsAsLines, formatReportSummary } from './reporting/format-report.js';
import type { Defect, QaReport } from '@bulwark/domain';

const VALID_CONFIG = {
  target: { url: 'http://localhost:5173/', viewport: { width: 1440, height: 900 } },
  design: { imagePath: 'design/home.png' },
  services: { detector: { kind: 'omniparser', baseUrl: 'http://localhost:8801' } },
  output: { artifactsDir: 'out/artifacts' },
};

describe('loadConfig', () => {
  it('resolves paths against the config file, not the working directory', async () => {
    const loaded = await loadConfig('/project/qa/bulwark.config.json', () =>
      Promise.resolve(JSON.stringify(VALID_CONFIG)),
    );

    expect(loaded.baseDir).toBe('/project/qa');
    expect(loaded.designImagePath).toBe('/project/qa/design/home.png');
    expect(loaded.artifactsDir).toBe('/project/qa/out/artifacts');
    expect(loaded.cacheDir).toBeUndefined();
  });

  it('keeps absolute paths as they are', async () => {
    const loaded = await loadConfig('/project/bulwark.config.json', () =>
      Promise.resolve(
        JSON.stringify({
          ...VALID_CONFIG,
          design: { imagePath: '/shared/design/home.png' },
          services: { ...VALID_CONFIG.services, cacheDir: '/var/cache/bulwark' },
        }),
      ),
    );

    expect(loaded.designImagePath).toBe('/shared/design/home.png');
    expect(loaded.cacheDir).toBe('/var/cache/bulwark');
  });

  it('explains how to create a missing config', async () => {
    const error = await loadConfig('/nope/bulwark.config.json', () =>
      Promise.reject(new Error('ENOENT')),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConfigurationError);
    expect((error as ConfigurationError).message).toContain('bulwark init');
  });

  it('reports malformed JSON separately from invalid configuration', async () => {
    await expect(loadConfig('/p/c.json', () => Promise.resolve('{ nope'))).rejects.toThrow(
      /not valid JSON/,
    );
    await expect(loadConfig('/p/c.json', () => Promise.resolve('{}'))).rejects.toThrow(
      /Invalid Bulwark configuration/,
    );
  });

  it('names the default config file', () => {
    expect(DEFAULT_CONFIG_FILENAME).toBe('bulwark.config.json');
  });
});

describe('resolveAgainst', () => {
  it('joins relative paths and passes absolute ones through', () => {
    expect(resolveAgainst('/base', 'sub/file.png')).toBe('/base/sub/file.png');
    expect(resolveAgainst('/base', '/abs/file.png')).toBe('/abs/file.png');
    expect(resolveAgainst('/base', '../sibling/file.png')).toBe('/sibling/file.png');
  });
});

describe('runDirectoryName', () => {
  it('uses the configured run id when there is one', () => {
    expect(runDirectoryName('nightly', '2026-02-01T12:00:00.000Z')).toBe('nightly');
  });

  it('otherwise derives a filesystem-safe name from the timestamp', () => {
    expect(runDirectoryName(undefined, '2026-02-01T12:34:56.789Z')).toBe(
      '2026-02-01T12-34-56-789Z',
    );
  });
});

describe('resolveWithinDirectory', () => {
  it('resolves a path inside the directory', () => {
    expect(resolveWithinDirectory('/runs/one', '/report.json')).toBe('/runs/one/report.json');
    expect(resolveWithinDirectory('/runs/one', '/')).toBe('/runs/one');
  });

  it('confines traversal attempts to the directory', () => {
    // Leading `..` segments collapse rather than climbing above the mount, so these
    // resolve to harmless paths inside the run directory that simply do not exist.
    expect(resolveWithinDirectory('/runs/one', '/../two/report.json')).toBe(
      '/runs/one/two/report.json',
    );
    expect(resolveWithinDirectory('/runs/one', '/../../etc/passwd')).toBe('/runs/one/etc/passwd');
    expect(resolveWithinDirectory('/runs/one', '/%2e%2e/%2e%2e/etc/passwd')).toBe(
      '/runs/one/etc/passwd',
    );
  });

  it('never resolves outside the directory, whatever the input', () => {
    const attempts = [
      '/../secret.txt',
      '/%2e%2e%2fsecret.txt',
      '/a/../../secret.txt',
      '/./../../secret.txt',
      '//etc/passwd',
    ];
    for (const attempt of attempts) {
      const resolved = resolveWithinDirectory('/runs/one', attempt);
      expect(resolved === null || resolved.startsWith('/runs/one')).toBe(true);
    }
  });

  it('refuses malformed encodings and null bytes', () => {
    expect(resolveWithinDirectory('/runs/one', '/%ZZ')).toBeNull();
    expect(resolveWithinDirectory('/runs/one', '/report%00.json')).toBeNull();
  });
});

describe('contentTypeFor', () => {
  it('maps the types the dashboard loads', () => {
    expect(contentTypeFor('/index.html')).toBe('text/html; charset=utf-8');
    expect(contentTypeFor('/report.json')).toBe('application/json; charset=utf-8');
    expect(contentTypeFor('/live-screenshot.PNG')).toBe('image/png');
    expect(contentTypeFor('/bundle.js')).toBe('text/javascript; charset=utf-8');
    expect(contentTypeFor('/unknown.bin')).toBe('application/octet-stream');
  });
});

describe('createStaticServer', () => {
  let root: string;
  let dashboard: string;
  let stop: (() => Promise<void>) | null = null;
  let baseUrl = '';

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'bulwark-serve-'));
    dashboard = join(root, 'dashboard');
    await mkdir(join(root, 'run'), { recursive: true });
    await mkdir(dashboard, { recursive: true });
    await writeFile(join(root, 'run', 'report.json'), '{"runId":"r1"}');
    await writeFile(join(root, 'secret.txt'), 'do not serve me');
    await writeFile(join(dashboard, 'index.html'), '<!doctype html><title>overlay</title>');

    const { listen } = createStaticServer({
      mounts: [
        { prefix: '/artifacts', directory: join(root, 'run') },
        { prefix: '/', directory: dashboard, spaFallback: true },
      ],
      port: 0,
      host: '127.0.0.1',
    });
    const server = await listen();
    baseUrl = `http://127.0.0.1:${server.port}`;
    stop = () => server.close();
  });

  afterEach(async () => {
    await stop?.();
    stop = null;
    await rm(root, { recursive: true, force: true });
  });

  it('serves an artifact with the right content type', async () => {
    const response = await fetch(`${baseUrl}/artifacts/report.json`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await response.json()).toEqual({ runId: 'r1' });
  });

  it('serves the dashboard at the root', async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('overlay');
  });

  it('falls back to the dashboard entry point for client-side routes', async () => {
    const response = await fetch(`${baseUrl}/defect/42`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('overlay');
  });

  it('never serves a file that sits above a mount', async () => {
    // Encoded so the client does not normalise the traversal away before sending it.
    const response = await fetch(`${baseUrl}/artifacts/%2e%2e%2fsecret.txt`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('do not serve me');
  });

  it('does not leak a file above the mount through the dashboard fallback', async () => {
    const response = await fetch(`${baseUrl}/secret.txt`);
    expect(await response.text()).not.toContain('do not serve me');
  });

  it('rejects write methods', async () => {
    const response = await fetch(`${baseUrl}/artifacts/report.json`, { method: 'DELETE' });
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, HEAD');
  });

  it('answers HEAD without a body', async () => {
    const response = await fetch(`${baseUrl}/artifacts/report.json`, { method: 'HEAD' });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('returns 404 for a missing artifact', async () => {
    expect((await fetch(`${baseUrl}/artifacts/missing.png`)).status).toBe(404);
  });
});

const REPORT: QaReport = {
  schemaVersion: 1,
  runId: 'run-1',
  generatedAt: '2026-02-01T12:00:00.000Z',
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
    passed: false,
    totalDefects: 2,
    bySeverity: { error: 1, warning: 1 },
    byType: { spacing: 1, 'font-weight': 1 },
    designElementCount: 4,
    liveElementCount: 4,
    matchedElementCount: 4,
    matchRate: 1,
  },
  defects: [
    {
      id: 'spacing:vertical:a->b',
      type: 'spacing',
      severity: 'error',
      message: 'Extra vertical space between "a" and "b"',
      axis: 'vertical',
      designGapPx: 24,
      liveGapPx: 32,
      deltaPx: 8,
      tolerancePx: 2,
      betweenDesignElementIds: ['a', 'b'],
      betweenLiveElementIds: ['a', 'b'],
    },
    {
      id: 'font-weight:heading',
      type: 'font-weight',
      severity: 'warning',
      message: 'Heading is lighter than the design',
      expectedWeight: 700,
      actualWeight: 400,
      strokeDensity: 0.2,
      fontFamily: 'Mark Pro',
    },
  ],
  measurements: {
    designElements: [],
    liveElements: [],
    pairs: [],
    spacing: [],
    typography: [],
    colors: [],
  },
  diagnostics: {
    warnings: ['Skipped 1 spacing comparison'],
    detector: 'omniparser',
    textRecognizer: 'ink-projection',
    durationMs: 1234,
  },
};

describe('formatReportSummary', () => {
  it('leads with the verdict and the counts', () => {
    const output = formatReportSummary(REPORT, { color: false });
    const lines = output.split('\n');

    expect(lines[0]).toBe('FAIL http://localhost:4173/ against figma-screenshot.png (run run-1)');
    expect(lines[1]).toContain('4/4 design elements matched, 2 defect(s) in 1234ms');
    expect(lines[2]).toContain('severity: 1 error, 1 warning');
  });

  it('lists each defect with its type', () => {
    const output = formatReportSummary(REPORT, { color: false });
    expect(output).toContain('[spacing] Extra vertical space');
    expect(output).toContain('[font-weight] Heading is lighter');
  });

  it('includes diagnostics so skipped work is visible', () => {
    expect(formatReportSummary(REPORT, { color: false })).toContain('Skipped 1 spacing comparison');
  });

  it('marks a passing run', () => {
    const passing: QaReport = {
      ...REPORT,
      defects: [],
      summary: { ...REPORT.summary, passed: true, totalDefects: 0, bySeverity: {}, byType: {} },
      diagnostics: { ...REPORT.diagnostics, warnings: [] },
    };
    expect(formatReportSummary(passing, { color: false }).startsWith('PASS')).toBe(true);
  });
});

describe('formatDefectsAsLines', () => {
  it('emits severity, type, id and message per line', () => {
    const lines = formatDefectsAsLines(REPORT.defects as Defect[]).split('\n');
    expect(lines[0]?.split('\t')).toEqual([
      'error',
      'spacing',
      'spacing:vertical:a->b',
      'Extra vertical space between "a" and "b"',
    ]);
  });

  it('returns an empty string for no defects', () => {
    expect(formatDefectsAsLines([])).toBe('');
  });
});
