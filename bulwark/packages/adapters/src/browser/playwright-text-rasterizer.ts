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
 *
 * A single BrowserContext/Page is reused across renders. {@link renderMany} packs
 * multiple sizes into one document for size-fit sweeps.
 */
export class PlaywrightTextRasterizer implements TextRasterizer {
  readonly name = 'playwright-canvas';
  private browser: Browser | null = null;
  private context: import('playwright').BrowserContext | null = null;
  private page: Page | null = null;
  private readonly availability = new Map<string, boolean>();

  constructor(private readonly options: PlaywrightTextRasterizerOptions = {}) {}

  async render(request: TextRenderRequest): Promise<TextRenderResult> {
    if (request.text.trim().length === 0) {
      throw new ServiceError(this.name, 'cannot render an empty string as a reference');
    }

    const page = await this.ensurePage();
    try {
      await page.setContent(buildDocument(request), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);

      const available = await this.isFamilyAvailable(
        page,
        request.fontFamily,
        request.text,
        request.fontSizePx,
      );

      const buffer = await page.locator('#sample').screenshot({ type: 'png', animations: 'disabled' });
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
    }
  }

  async renderMany(
    request: Omit<TextRenderRequest, 'fontSizePx'>,
    sizesPx: readonly number[],
  ): Promise<readonly (TextRenderResult & { readonly fontSizePx: number })[]> {
    if (request.text.trim().length === 0) {
      throw new ServiceError(this.name, 'cannot render an empty string as a reference');
    }
    const uniqueSizes = [...new Set(sizesPx.map((size) => Math.round(size)))].filter(
      (size) => size > 0,
    );
    if (uniqueSizes.length === 0) return [];

    const page = await this.ensurePage();
    try {
      await page.setContent(buildMultiDocument(request, uniqueSizes), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);

      const available = await this.isFamilyAvailable(
        page,
        request.fontFamily,
        request.text,
        uniqueSizes[0]!,
      );
      const resolvedFontFamily = available
        ? request.fontFamily
        : `${request.fontFamily} (substituted)`;

      const results: (TextRenderResult & { readonly fontSizePx: number })[] = [];
      for (const size of uniqueSizes) {
        const buffer = await page
          .locator(`#sample-${size}`)
          .screenshot({ type: 'png', animations: 'disabled' });
        const raster = decodePng(new Uint8Array(buffer));
        results.push({
          fontSizePx: size,
          image: new Uint8Array(buffer),
          width: raster.width,
          height: raster.height,
          resolvedFontFamily,
        });
      }
      return results;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(
        this.name,
        `failed to batch-render "${request.text}" in ${request.fontFamily}`,
        {},
        { cause: error },
      );
    }
  }

  async listAvailableFamilies(): Promise<readonly string[]> {
    const families = this.options.expectedFamilies ?? [];
    if (families.length === 0) return [];

    const page = await this.ensurePage();
    await page.setContent('<body></body>');
    await page.evaluate(() => document.fonts.ready);
    const available: string[] = [];
    for (const family of families) {
      const isAvailable = await this.isFamilyAvailable(
        page,
        family,
        'HAMBURGEFONTSIV hamburgefonts',
        48,
      );
      if (isAvailable) available.push(family);
    }
    return available;
  }

  async close(): Promise<void> {
    await this.context?.close();
    this.context = null;
    this.page = null;
    this.availability.clear();
    await this.browser?.close();
    this.browser = null;
  }

  private async isFamilyAvailable(
    page: Page,
    family: string,
    text: string,
    sizePx: number,
  ): Promise<boolean> {
    const cached = this.availability.get(family);
    if (cached !== undefined) return cached;
    const available = await evaluateFontAvailability(page, family, text, sizePx);
    this.availability.set(family, available);
    return available;
  }

  private async ensurePage(): Promise<Page> {
    if (this.page !== null) return this.page;
    const browser = await this.ensureBrowser();
    this.context = await browser.newContext({ deviceScaleFactor: 1, colorScheme: 'light' });
    this.page = await this.context.newPage();
    return this.page;
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

function buildMultiDocument(
  request: Omit<TextRenderRequest, 'fontSizePx'>,
  sizesPx: readonly number[],
): string {
  const letterSpacing =
    request.letterSpacingPx === undefined ? 'normal' : `${request.letterSpacingPx}px`;
  const samples = sizesPx
    .map(
      (size) =>
        `<span id="sample-${size}" class="sample" style="font-size:${size}px">${escapeHtml(request.text)}</span>`,
    )
    .join('\n');
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 8px; background: ${escapeCss(request.backgroundColor)}; }
  .sample {
    display: block;
    margin: 8px 0;
    padding: 4px 6px;
    background: ${escapeCss(request.backgroundColor)};
    color: ${escapeCss(request.color)};
    font-family: ${escapeCss(request.fontFamily)}, sans-serif;
    font-weight: ${request.fontWeight};
    letter-spacing: ${letterSpacing};
    line-height: 1.2;
    white-space: pre;
    -webkit-font-smoothing: antialiased;
  }
</style></head>
<body>${samples}</body></html>`;
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
