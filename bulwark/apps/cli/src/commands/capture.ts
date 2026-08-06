import { canonicalStringify } from '@bulwark/domain';
import type { CliContext } from './context.js';
import { prepareRun } from './context.js';

export const LIVE_DOM_ARTIFACT_PATH = 'live-dom.json';
export const LIVE_SCREENSHOT_ARTIFACT_PATH = 'live-screenshot.png';

export interface CaptureCommandOptions {
  readonly configPath: string;
}

/**
 * Captures the live page without analysing it.
 *
 * Useful on its own: it is the step that needs a browser, so separating it lets a
 * developer collect artifacts on a machine with Playwright and analyse them anywhere.
 */
export async function captureCommand(
  context: CliContext,
  options: CaptureCommandOptions,
): Promise<number> {
  const prepared = await prepareRun(context, options.configPath);
  const config = prepared.loaded.config;

  const capture = await prepared.services.inspector.capture({
    url: config.target.url,
    viewport: config.target.viewport,
    fullPage: config.target.fullPage,
    settleMs: config.target.settleMs,
    stabilize: config.target.stabilize,
    ...(config.target.waitForSelector === undefined
      ? {}
      : { waitForSelector: config.target.waitForSelector }),
  });

  const screenshotPath = await prepared.store.write(
    LIVE_SCREENSHOT_ARTIFACT_PATH,
    capture.screenshot,
  );
  const domPath = await prepared.store.writeText(
    LIVE_DOM_ARTIFACT_PATH,
    canonicalStringify({
      url: capture.url,
      viewport: capture.viewport,
      engine: capture.engine,
      imageWidth: capture.imageWidth,
      imageHeight: capture.imageHeight,
      elements: capture.elements,
    }),
  );

  context.stdout(`captured ${capture.elements.length} element(s) from ${capture.url}`);
  context.stdout(`  screenshot: ${screenshotPath}`);
  context.stdout(`  dom: ${domPath}`);
  return 0;
}
