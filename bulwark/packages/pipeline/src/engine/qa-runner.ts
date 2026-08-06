import type { QaReport } from '@bulwark/domain';
import { canonicalStringify } from '@bulwark/domain';
import type { ArtifactStore, LiveInspector, Logger } from '@bulwark/ports';
import { MissingArtifactError } from '@bulwark/ports';
import type { BulwarkConfig } from '../config/config.js';
import type { QaEngine } from './qa-engine.js';

export const DESIGN_ARTIFACT_PATH = 'figma-screenshot.png';
export const LIVE_ARTIFACT_PATH = 'live-screenshot.png';
export const REPORT_ARTIFACT_PATH = 'report.json';

export interface QaRunnerDeps {
  readonly engine: QaEngine;
  readonly inspector: LiveInspector;
  readonly store: ArtifactStore;
  readonly logger: Logger;
  /** Reads the design export; separate from the artifact store, which is per run. */
  readonly readDesignImage: () => Promise<Uint8Array>;
}

export interface RunResult {
  readonly report: QaReport;
  readonly reportPath: string;
  readonly designImagePath: string;
  readonly liveImagePath: string;
}

/**
 * Captures the live page, analyses it against the design, and writes the run's
 * artifacts.
 *
 * Both images are copied into the run directory next to the report. A report that
 * points at files which may have been overwritten by the next run is not evidence,
 * and the overlay dashboard needs the exact pixels the measurements came from.
 */
export class QaRunner {
  constructor(
    private readonly deps: QaRunnerDeps,
    private readonly config: BulwarkConfig,
  ) {}

  async run(): Promise<RunResult> {
    const designImage = await this.readDesign();

    this.deps.logger.log('info', 'capturing the live implementation', {
      url: this.config.target.url,
    });
    const live = await this.deps.inspector.capture({
      url: this.config.target.url,
      viewport: this.config.target.viewport,
      fullPage: this.config.target.fullPage,
      settleMs: this.config.target.settleMs,
      stabilize: this.config.target.stabilize,
      ...(this.config.target.waitForSelector === undefined
        ? {}
        : { waitForSelector: this.config.target.waitForSelector }),
    });

    const report = await this.deps.engine.analyze({
      designImage,
      live,
      designImagePath: DESIGN_ARTIFACT_PATH,
      liveImagePath: LIVE_ARTIFACT_PATH,
    });

    const designImagePath = await this.deps.store.write(DESIGN_ARTIFACT_PATH, designImage);
    const liveImagePath = await this.deps.store.write(LIVE_ARTIFACT_PATH, live.screenshot);
    const reportPath = await this.deps.store.writeText(
      REPORT_ARTIFACT_PATH,
      canonicalStringify(report),
    );

    this.deps.logger.log(report.summary.passed ? 'info' : 'warn', 'analysis complete', {
      passed: report.summary.passed,
      defects: report.summary.totalDefects,
      reportPath,
    });

    return { report, reportPath, designImagePath, liveImagePath };
  }

  private async readDesign(): Promise<Uint8Array> {
    try {
      return await this.deps.readDesignImage();
    } catch (error) {
      throw new MissingArtifactError(
        `Could not read the design export at "${this.config.design.imagePath}". ` +
          `Export the frame from Figma and point design.imagePath at it.`,
        { path: this.config.design.imagePath },
        { cause: error },
      );
    }
  }
}
