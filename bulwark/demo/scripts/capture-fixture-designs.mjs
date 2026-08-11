/**
 * Capture design PNGs for every fixture in demo/fixtures/catalog.json.
 *
 * Usage (from bulwark/):
 *   node demo/scripts/capture-fixture-designs.mjs
 *   node demo/scripts/capture-fixture-designs.mjs landing admin
 */

import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const demoTargetRoot = resolve(repoRoot, 'apps/demo-target');
const fixturesRoot = resolve(repoRoot, 'demo/fixtures');

const require = createRequire(resolve(repoRoot, 'packages/adapters/package.json'));
const { chromium } = require('playwright');

const catalog = JSON.parse(await readFile(join(fixturesRoot, 'catalog.json'), 'utf8'));
const only = new Set(process.argv.slice(2));
const fixtureIds = only.size > 0 ? catalog.fixtures.filter((id) => only.has(id)) : catalog.fixtures;

const manifests = [];
for (const id of fixtureIds) {
  manifests.push(JSON.parse(await readFile(join(fixturesRoot, id, 'manifest.json'), 'utf8')));
}

const { port, close } = await serveDemoTarget(demoTargetRoot, manifests);
const browser = await chromium.launch({ headless: true });

try {
  for (const manifest of manifests) {
    const viewport = manifest.viewport;
    const outputPath = join(fixturesRoot, manifest.id, 'design', 'figma-screenshot.png');
    const page = await browser.newPage({
      viewport: {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      },
    });
    try {
      const url = `http://127.0.0.1:${port}${manifest.routes.correct}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForSelector(manifest.sceneSelector ?? 'main.scene');
      await page.waitForTimeout(400);
      const png = await page.locator(manifest.sceneSelector ?? 'main.scene').screenshot({ type: 'png' });
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, png);
      console.log(
        `wrote ${outputPath} (${viewport.width}x${viewport.height}, expect ${manifest.expectedLeafCount} leaves, ${manifest.seeds.length} seeds)`,
      );
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  await close();
}

async function serveDemoTarget(root, fixtureManifests) {
  const contentTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
  ]);

  const byPath = new Map();
  for (const manifest of fixtureManifests) {
    byPath.set(manifest.routes.correct, manifest);
    for (const alias of manifest.aliases ?? []) {
      if (!alias.endsWith('-broken') && alias !== '/broken') {
        byPath.set(alias, manifest);
      }
    }
  }

  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const manifest = byPath.get(url.pathname);
    if (manifest) {
      const html = await readFile(join(root, manifest.template), 'utf8');
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
      await access(filePath);
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
    close: () =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => (error ? rejectClose(error) : resolveClose()));
      }),
  };
}
