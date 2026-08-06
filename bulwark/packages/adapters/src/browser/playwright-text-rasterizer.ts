import type { Browser, Page } from 'playwright';
import type { TextRasterizer, TextRenderRequest, TextRenderResult } from '@bulwark/ports';
import { ServiceError } from '@bulwark/ports';
import { decodePng } from '@bulwark/imaging';

export interface PlaywrightTextRasterizerOptions {
  readonly launch?: () => Promise<Browser>;
  /** Families to verify at start-up, so a missing font is reported not guessed. */
  readonly expectedFamilies?: readonly string[];
}

/**
 * Renders reference strings in a real browser, in the real typefaces.
 *
 * The font-family check compares the design crop against these renders, so they have
 * to come from the same rasterizer the implementation uses. A canvas-free
 * approximation would compare the design against a drawing of a font rather than the
 * font itself.
 *
 * Availability is measured rather than trusted: `document.fonts.check` reports true
 * for a family the browser will silently substitute, so the width of the string is
 * compared against the same string in a generic fallback.
 */
export class PlaywrightTextRasterizer implements TextRasterizer {
  readonly name = 'playwright-canvas';
  private browser: Browser | null = null;

  constructor(private readonly options: PlaywrightTextRasterizerOptions = {}) {}

  async render(request: TextRenderRequest): Promise<TextRenderResult> {
    if (request.text.trim().length === 0) {
      throw new ServiceError(this.name, 'cannot render an empty string as a reference');
    }

    const browser = await this.ensureBrowser();
    const context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: 'light' });
    try {
      const page = await context.newPage();
      await page.setContent(buildDocument(request), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);

      const available = await evaluateFontAvailability(
        page,
        request.fontFamily,
        request.text,
        request.fontSizePx,
      );

      const target = page.locator('#sample');
      const buffer = await target.screenshot({ type: 'png', animations: 'disabled' });
      const raster = decodePng(new Uint8Array(buffer));

      return {
        image: new Uint8Array(buffer),
        width: raster.width,
        height: raster.height,
        resolvedFontFamily: available ? request.fontFamily : `${request.fontFamily} (substituted)`,
      };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        this.name,
        `failed to render "${request.text}" in ${request.fontFamily}`,
        {},
        { cause: error },
      );
    } finally {
      await context.close();
    }
  }

  async listAvailableFamilies(): Promise<readonly string[]> {
    const families = this.options.expectedFamilies ?? [];
    if (families.length === 0) return [];

    const browser = await this.ensureBrowser();
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await page.setContent('<body></body>');
      await page.evaluate(() => document.fonts.ready);
      const available: string[] = [];
      for (const family of families) {
        const isAvailable = await evaluateFontAvailability(
          page,
          family,
          'HAMBURGEFONTSIV hamburgefonts',
          48,
        );
        if (isAvailable) available.push(family);
      }
      return available;
    } finally {
      await context.close();
    }
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
  }

  private async ensureBrowser(): Promise<Browser> {
    if (this.browser !== null) return this.browser;
    if (this.options.launch !== undefined) {
      this.browser = await this.options.launch();
      return this.browser;
    }
    try {
      const { chromium } = await import('playwright');
      this.browser = await chromium.launch({
        args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
      });
      return this.browser;
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

function buildDocument(request: TextRenderRequest): string {
  const letterSpacing =
    request.letterSpacingPx === undefined ? 'normal' : `${request.letterSpacingPx}px`;
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; background: ${escapeCss(request.backgroundColor)}; }
  #sample {
    display: inline-block;
    padding: 4px 6px;
    background: ${escapeCss(request.backgroundColor)};
    color: ${escapeCss(request.color)};
    font-family: ${escapeCss(request.fontFamily)}, sans-serif;
    font-size: ${request.fontSizePx}px;
    font-weight: ${request.fontWeight};
    letter-spacing: ${letterSpacing};
    line-height: 1.2;
    white-space: pre;
    -webkit-font-smoothing: antialiased;
  }
</style></head>
<body><span id="sample">${escapeHtml(request.text)}</span></body></html>`;
}

function evaluateFontAvailability(
  page: Page,
  family: string,
  text: string,
  sizePx: number,
): Promise<boolean> {
  return page.evaluate(
    ([source, candidate, sample, size]) => {
      const probe = new Function(`return (${source})`)() as (
        family: string,
        text: string,
        sizePx: number,
      ) => boolean;
      return probe(candidate, sample, size);
    },
    [measureFontAvailability.toString(), family, text, sizePx] as const,
  );
}

/** Runs inside the page; serialized in rather than imported. */
function measureFontAvailability(family: string, text: string, sizePx: number): boolean {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context === null) return false;

  const sample = text.length > 0 ? text : 'HAMBURGEFONTSIV';
  const widthFor = (fontFamily: string): number => {
    context.font = `${sizePx}px ${fontFamily}`;
    return context.measureText(sample).width;
  };

  // A substituted family measures exactly like the fallback it resolved to.
  const fallbacks = ['monospace', 'serif', 'sans-serif'];
  return fallbacks.some((fallback) => {
    const candidate = widthFor(`"${family}", ${fallback}`);
    const baseline = widthFor(fallback);
    return Math.abs(candidate - baseline) > 0.5;
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCss(value: string): string {
  if (!/^[#a-zA-Z0-9 ,.'"()%-]+$/.test(value)) {
    throw new ServiceError('playwright-canvas', `refusing to inject unsafe CSS value "${value}"`);
  }
  return value;
}
