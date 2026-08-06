import { describe, expect, it } from 'vitest';
import { MissingArtifactError } from '@bulwark/ports';
import { canonicalStringify } from '@bulwark/domain';
import { createHarness } from '../testing/harness.js';
import { REFERENCE_SCENE, mutateScene } from '../testing/fixtures.js';
import {
  DESIGN_ARTIFACT_PATH,
  LIVE_ARTIFACT_PATH,
  QaRunner,
  REPORT_ARTIFACT_PATH,
} from './qa-runner.js';

describe('QaRunner', () => {
  it('writes both surfaces and a canonical report into the run directory', async () => {
    const harness = createHarness({ designSpec: REFERENCE_SCENE });
    const result = await harness.runner.run();

    expect(await harness.store.list()).toEqual([
      DESIGN_ARTIFACT_PATH,
      LIVE_ARTIFACT_PATH,
      REPORT_ARTIFACT_PATH,
    ]);
    expect(result.reportPath).toContain(REPORT_ARTIFACT_PATH);
    expect(await harness.store.read(DESIGN_ARTIFACT_PATH)).toEqual(harness.designScene.png);
    expect(await harness.store.read(LIVE_ARTIFACT_PATH)).toEqual(harness.live.screenshot);
  });

  it('writes the report exactly as the canonical serializer produces it', async () => {
    const harness = createHarness({ designSpec: REFERENCE_SCENE });
    const result = await harness.runner.run();

    expect(await harness.store.readText(REPORT_ARTIFACT_PATH)).toBe(
      canonicalStringify(result.report),
    );
  });

  it('points the report at the artifact paths the dashboard will load', async () => {
    const { report } = await createHarness({ designSpec: REFERENCE_SCENE }).runner.run();

    expect(report.surfaces.design.imagePath).toBe(DESIGN_ARTIFACT_PATH);
    expect(report.surfaces.live.imagePath).toBe(LIVE_ARTIFACT_PATH);
  });

  it('captures with the configured target settings', async () => {
    const harness = createHarness({
      designSpec: REFERENCE_SCENE,
      config: {
        target: {
          url: 'http://demo-app/',
          viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
          waitForSelector: '#ready',
          settleMs: 400,
          fullPage: true,
        },
      },
    });
    await harness.runner.run();

    expect(harness.inspector.requests).toHaveLength(1);
    expect(harness.inspector.requests[0]).toMatchObject({
      url: 'http://demo-app/',
      waitForSelector: '#ready',
      settleMs: 400,
      fullPage: true,
      stabilize: true,
    });
    expect(harness.logger.messages('info')).toContain('capturing the live implementation');
  });

  it('omits an unset selector rather than sending undefined to the browser', async () => {
    const harness = createHarness({ designSpec: REFERENCE_SCENE });
    await harness.runner.run();
    expect(harness.inspector.requests[0]).not.toHaveProperty('waitForSelector');
  });

  it('logs a warning-level summary when the run fails', async () => {
    const liveSpec = mutateScene(REFERENCE_SCENE, { cta: { background: '#3b82f6' } });
    const harness = createHarness({ designSpec: REFERENCE_SCENE, liveSpec });
    const { report } = await harness.runner.run();

    expect(report.summary.passed).toBe(false);
    expect(harness.logger.messages('warn')).toContain('analysis complete');
  });

  it('explains how to fix a missing design export', async () => {
    const harness = createHarness({ designSpec: REFERENCE_SCENE });
    const runner = new QaRunner(
      {
        engine: harness.engine,
        inspector: { name: 'unused', capture: () => Promise.resolve(harness.live) },
        store: harness.store,
        logger: harness.logger,
        readDesignImage: () => Promise.reject(new Error('ENOENT')),
      },
      { ...harness.config, design: { ...harness.config.design, imagePath: 'missing/design.png' } },
    );

    const error = await runner.run().catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(MissingArtifactError);
    expect((error as MissingArtifactError).message).toContain('missing/design.png');
    expect((error as MissingArtifactError).message).toContain('Export the frame from Figma');
  });
});
