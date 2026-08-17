/* global console, process */

/**
 * Captures /complex as the design export PNG for the complex demo.
 *
 * Uses Playwright so the design raster matches the live HTML (fonts, borders,
 * anti-aliasing) instead of a hand-drawn rectangle scene.
 */

import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const demoTargetRoot = resolve(repoRoot, 'apps/demo-target');
const outputPath = resolve(repoRoot, 'demo/complex/design/figma-screenshot.png');

const require = createRequire(resolve(repoRoot, 'packages/adapters/package.json'));
const { chromium } = require('playwright');

const { port, close } = await serveDemoTarget(demoTargetRoot);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 800, height: 600, deviceScaleFactor: 1 },
  });
  await page.goto(`http://127.0.0.1:${port}/complex`, { waitUntil: 'networkidle' });
  await page.waitForSelector('main.scene');
  await page.waitForTimeout(400);
  const png = await page.locator('main.scene').screenshot({ type: 'png' });
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, png);
  console.log(`wrote ${outputPath}`);
} finally {
  await browser.close();
  await close();
}

async function serveDemoTarget(root) {
  const contentTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
  ]);

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (url.pathname === '/complex' || url.pathname === '/') {
      const html = await readFile(join(root, 'complex.html'), 'utf8');
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(
        html
          .replaceAll('__PAGE_CLASSES__', '')
          .replaceAll('__PAGE_VARIANT__', 'correct')
          .replaceAll('__DEFECT_SUMMARY__', 'correct layout'),
      );
      return;
    }

    const filePath = join(root, url.pathname.replace(/^\//, ''));
    try {
      const body = await readFile(filePath);
      response.writeHead(200, {
        'content-type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
      });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });

  await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('failed to bind ephemeral demo server');
  }
  return {
    port: address.port,
    close: () => new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    }),
  };
}
