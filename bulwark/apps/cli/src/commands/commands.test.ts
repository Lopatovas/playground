import { describe, expect, it } from 'vitest';
import { REFERENCE_SCENE, mutateScene } from '@bulwark/pipeline/testing';
import { canonicalStringify } from '@bulwark/domain';
import { createCliHarness } from '../testing/cli-harness.js';
import { EXIT_DEFECTS_FOUND, EXIT_OK, runCommand } from './run.js';
import { captureCommand } from './capture.js';
import { analyzeCommand } from './analyze.js';
import { initCommand, starterConfig } from './init.js';

const RUN_DIRECTORY = '/project/.artifacts/run-fixed';

describe('runCommand', () => {
  it('exits 0 and reports a pass for a faithful implementation', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    const code = await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'pretty',
      color: false,
    });

    expect(code).toBe(EXIT_OK);
    expect(harness.stdout.join('\n')).toContain('PASS');
    expect(harness.stdout.join('\n')).toContain('4/4 design elements matched');
  });

  it('exits 1 and lists the defect when the implementation drifts', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE, liveSpec });

    const code = await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'pretty',
      color: false,
    });

    expect(code).toBe(EXIT_DEFECTS_FOUND);
    const output = harness.stdout.join('\n');
    expect(output).toContain('FAIL');
    expect(output).toContain('[color]');
    expect(output).toContain('#2563eb');
  });

  it('can be told not to fail the process', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE, liveSpec });

    const code = await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'pretty',
      color: false,
      failOnDefects: false,
    });

    expect(code).toBe(EXIT_OK);
  });

  it('writes both surfaces and the report into the run directory', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'pretty',
      color: false,
    });

    expect(await harness.storeFor(RUN_DIRECTORY).list()).toEqual([
      'figma-screenshot.png',
      'live-screenshot.png',
      'report.json',
    ]);
  });

  it('emits the whole report as canonical JSON on request', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'json',
      color: false,
    });

    const parsed = JSON.parse(harness.stdout.join('\n')) as { runId: string; schemaVersion: number };
    expect(parsed.runId).toBe('run-fixed');
    expect(parsed.schemaVersion).toBe(1);
  });

  it('emits one tab-separated line per defect for CI annotations', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE, liveSpec });

    await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'lines',
      color: false,
    });

    const lines = harness.stdout.join('\n').split('\n').filter((line) => line.length > 0);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.split('\t')).toHaveLength(4);
    expect(lines[0]?.startsWith('error\tcolor\t')).toBe(true);
  });

  it('prints nothing but the summary when there is nothing to report', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'lines',
      color: false,
    });
    expect(harness.stdout).toEqual([]);
  });

  it('colors output only when asked', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    await runCommand(harness.context, {
      configPath: 'bulwark.config.json',
      format: 'pretty',
      color: true,
    });
    expect(harness.stdout[0]).toContain('\u001B[32m');
  });
});

describe('captureCommand', () => {
  it('writes a screenshot and a DOM snapshot without analysing', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    const code = await captureCommand(harness.context, { configPath: 'bulwark.config.json' });

    expect(code).toBe(0);
    expect(await harness.storeFor(RUN_DIRECTORY).list()).toEqual([
      'live-dom.json',
      'live-screenshot.png',
    ]);
    expect(harness.stdout[0]).toContain('captured 4 element(s)');
  });

  it('writes a DOM snapshot the analyze command can read back', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    await captureCommand(harness.context, { configPath: 'bulwark.config.json' });

    const snapshot = JSON.parse(
      await harness.storeFor(RUN_DIRECTORY).readText('live-dom.json'),
    ) as { elements: unknown[]; viewport: { width: number } };

    expect(snapshot.elements).toHaveLength(4);
    expect(snapshot.viewport.width).toBe(800);
  });
});

describe('analyzeCommand', () => {
  it('re-analyses stored artifacts and reaches the same verdict', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });
    const capture = createCliHarness({ designSpec: REFERENCE_SCENE, liveSpec });
    await captureCommand(capture.context, { configPath: 'bulwark.config.json' });

    const store = capture.storeFor(RUN_DIRECTORY);
    const files = new Map<string, Uint8Array>([
      ['/tmp/live.png', await store.read('live-screenshot.png')],
      [
        '/tmp/live-dom.json',
        new Uint8Array(Buffer.from(await store.readText('live-dom.json'), 'utf8')),
      ],
    ]);

    const analyze = createCliHarness({ designSpec: REFERENCE_SCENE, liveSpec, files });
    const code = await analyzeCommand(analyze.context, {
      configPath: 'bulwark.config.json',
      liveImage: '/tmp/live.png',
      liveDom: '/tmp/live-dom.json',
      format: 'pretty',
      color: false,
    });

    expect(code).toBe(EXIT_DEFECTS_FOUND);
    expect(analyze.stdout.join('\n')).toContain('[color]');
  });

  it('rejects a DOM snapshot that does not match the contract', async () => {
    const files = new Map<string, Uint8Array>([
      ['/tmp/live.png', new Uint8Array([1, 2, 3])],
      ['/tmp/live-dom.json', new Uint8Array(Buffer.from('{"elements":[]}', 'utf8'))],
    ]);
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE, files });

    await expect(
      analyzeCommand(harness.context, {
        configPath: 'bulwark.config.json',
        liveImage: '/tmp/live.png',
        liveDom: '/tmp/live-dom.json',
        format: 'pretty',
        color: false,
      }),
    ).rejects.toThrow(/does not match the expected shape/);
  });
});

describe('initCommand', () => {
  it('writes a starter config and explains the next steps', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    const written = new Map<string, string>();

    const code = await initCommand(harness.context, {
      outputPath: 'bulwark.config.json',
      url: 'http://localhost:3000/',
      designImagePath: 'design/home.png',
      force: false,
      writeFile: (path, contents) => {
        written.set(path, contents);
        return Promise.resolve();
      },
      fileExists: () => Promise.resolve(false),
    });

    expect(code).toBe(0);
    const contents = written.get('bulwark.config.json') ?? '';
    expect(JSON.parse(contents)).toMatchObject({
      target: { url: 'http://localhost:3000/' },
      design: { imagePath: 'design/home.png' },
    });
    expect(contents.endsWith('\n')).toBe(true);
    expect(harness.stdout.join('\n')).toContain('bulwark doctor');
  });

  it('refuses to overwrite an existing file unless forced', async () => {
    const harness = createCliHarness({ designSpec: REFERENCE_SCENE });
    const options = {
      outputPath: 'bulwark.config.json',
      url: 'http://localhost:3000/',
      designImagePath: 'design/home.png',
      writeFile: () => Promise.resolve(),
      fileExists: () => Promise.resolve(true),
    };

    expect(await initCommand(harness.context, { ...options, force: false })).toBe(1);
    expect(harness.stderr.join('\n')).toContain('--force');
    expect(await initCommand(harness.context, { ...options, force: true })).toBe(0);
  });

  it('produces a configuration the parser accepts', async () => {
    const { parseConfig } = await import('@bulwark/pipeline');
    const config = starterConfig({
      url: 'http://localhost:5173/',
      designImagePath: 'design/home.png',
    });
    expect(() => parseConfig(config)).not.toThrow();
    expect(canonicalStringify(config)).toContain('"spacingPx": 2');
  });
});
