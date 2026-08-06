import type { Browser, BrowserContext, Page } from 'playwright';
import type {
  LiveCapture,
  LiveCaptureRequest,
  LiveDomElement,
  LiveInspector,
} from '@bulwark/ports';
import { ServiceError } from '@bulwark/ports';
import { decodePng } from '@bulwark/imaging';
import { createBox } from '@bulwark/domain';
import type { CollectOptions, CollectedElement } from './dom-collector.js';
import { DEFAULT_COLLECT_OPTIONS, collectDomElements } from './dom-collector.js';

/**
 * CSS injected before capture to remove every source of frame-to-frame variation.
 *
 * Without it, a caret blink, a hover transition or a scroll animation makes two
 * captures of an unchanged page differ, and the engine would report the difference as
 * a regression.
 */
export const STABILIZE_CSS = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  caret-color: transparent !important;
}
html { scroll-behavior: auto !important; }
::-webkit-scrollbar { display: none !important; }
`;

export interface PlaywrightLiveInspectorOptions {
  /** Provide a launcher to reuse a browser across runs or to inject a fake. */
  readonly launch?: () => Promise<Browser>;
  readonly collect?: Partial<CollectOptions>;
  readonly navigationTimeoutMs?: number;
}

/**
 * Captures the live page with Playwright: one screenshot plus the computed styles
 * behind it, from a single page load.
 */
export class PlaywrightLiveInspector implements LiveInspector {
  readonly name = 'playwright';
  private readonly collectOptions: CollectOptions;

  constructor(private readonly options: PlaywrightLiveInspectorOptions = {}) {
    this.collectOptions = { ...DEFAULT_COLLECT_OPTIONS, ...options.collect };
  }

  async capture(request: LiveCaptureRequest): Promise<LiveCapture> {
    const browser = await this.launchBrowser();
    let context: BrowserContext | undefined;
    try {
      context = await browser.newContext({
        viewport: { width: request.viewport.width, height: request.viewport.height },
        deviceScaleFactor: request.viewport.deviceScaleFactor,
        // A fixed locale and timezone keep dates and number formats stable between runs.
        locale: 'en-US',
        timezoneId: 'UTC',
        colorScheme: 'light',
        reducedMotion: 'reduce',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(this.options.navigationTimeoutMs ?? 30_000);

      await page.goto(request.url, { waitUntil: 'load' });
      if (request.waitForSelector !== undefined) {
        await page.waitForSelector(request.waitForSelector, { state: 'visible' });
      }
      await page.evaluate(() => document.fonts.ready);
      if (request.stabilize !== false) {
        await page.addStyleTag({ content: STABILIZE_CSS });
      }
      if (request.settleMs !== undefined && request.settleMs > 0) {
        await page.waitForTimeout(request.settleMs);
      }

      const collected = await this.collectElements(page, request.fullPage === true);
      const screenshot = await page.screenshot({
        fullPage: request.fullPage === true,
        animations: 'disabled',
        caret: 'hide',
        type: 'png',
      });

      const raster = decodePng(new Uint8Array(screenshot));

      return {
        screenshot: new Uint8Array(screenshot),
        elements: collected.map(toLiveElement),
        viewport: request.viewport,
        imageWidth: raster.width,
        imageHeight: raster.height,
        url: page.url(),
        engine: `${browser.browserType().name()} ${browser.version()}`,
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(this.name, `failed to capture ${request.url}`, {}, { cause: error });
    } finally {
      await context?.close();
      await browser.close();
    }
  }

  private async collectElements(page: Page, fullPage: boolean): Promise<CollectedElement[]> {
    const options: CollectOptions = { ...this.collectOptions, includeScrollOffset: fullPage };
    return page.evaluate(
      ([collector, collectorOptions]) => {
        const factory = new Function(`return (${collector})`) as () => (
          options: CollectOptions,
        ) => CollectedElement[];
        return factory()(collectorOptions);
      },
      [collectDomElements.toString(), options] as const,
    );
  }

  private async launchBrowser(): Promise<Browser> {
    if (this.options.launch !== undefined) return this.options.launch();
    try {
      const { chromium } = await import('playwright');
      return await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
    } catch (error) {
      throw new ServiceError(
        this.name,
        'could not launch Chromium. Install the browser with "npx playwright install chromium"',
        {},
        { cause: error },
      );
    }
  }
}

function toLiveElement(element: CollectedElement): LiveDomElement {
  return {
    id: element.id,
    tagName: element.tagName,
    box: createBox(element.box.xMin, element.box.yMin, element.box.xMax, element.box.yMax),
    text: element.text,
    style: {
      fontFamily: element.style.fontFamily,
      fontSizePx: element.style.fontSizePx,
      fontWeight: element.style.fontWeight,
      lineHeightPx: element.style.lineHeightPx,
      letterSpacingPx: element.style.letterSpacingPx,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      borderRadiusPx: element.style.borderRadiusPx,
      opacity: element.style.opacity,
    },
    hasTransparentBackground: element.hasTransparentBackground,
    depth: element.depth,
  };
}
