/**
 * Calibrate visualToCssRatio for font families via Playwright + ink measurement.
 *
 * Usage (from bulwark/):
 *   node demo/scripts/calibrate-font-profiles.mjs
 *   node demo/scripts/calibrate-font-profiles.mjs --write-configs
 *
 * Without --write-configs, prints profiles JSON to stdout.
 * With --write-configs, merges candidateFamilies + profiles into every fixture
 * bulwark*.config.json from font-kits.json.
 *
 * Raw ink÷CSS from a clean Playwright sample overestimates the ratio seen on
 * ScreenParser design crops (AA + median-character + box clipping). We scale by
 * DETECTOR_RATIO_SCALE so expected CSS sizes sit near live when the page is correct.
 * Tuned on the 18-fixture ink suite: unscaled ≈47 font-size FPs; 0.92 ≈37 with
 * 8/8 type soft recall and ~0 mean (live−expected) bias.
 */

import { createRequire } from 'node:module';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const kitsPath = join(repoRoot, 'demo/fixtures/font-kits.json');
const fixturesRoot = join(repoRoot, 'demo/fixtures');
const writeConfigs = process.argv.includes('--write-configs');

/** Bridges clean Playwright calibration → detector-crop ink heights. */
const DETECTOR_RATIO_SCALE = 0.92;

const require = createRequire(join(repoRoot, 'packages/adapters/package.json'));
const { chromium } = require('playwright');

const imaging = await import(
  pathToFileURL(join(repoRoot, 'packages/imaging/dist/index.js')).href
);
const { decodePng, measureGlyphShape } = imaging;

const kits = JSON.parse(await readFile(kitsPath, 'utf8'));
const weightBands = kits.defaultWeightBands;

/** @type {Map<string, { css: string, families: Set<string> }>} */
const byCss = new Map();
for (const kit of Object.values(kits.fixtures)) {
  const key = kit.googleCss;
  if (!byCss.has(key)) byCss.set(key, { css: key, families: new Set() });
  byCss.get(key).families.add(kit.body);
  byCss.get(key).families.add(kit.display);
}

const sampleText = 'Hg';
const cssFontSizePx = 100;
/** @type {Map<string, number>} */
const ratios = new Map();

const browser = await chromium.launch({ headless: true });
try {
  for (const { css, families } of byCss.values()) {
    for (const family of families) {
      if (ratios.has(family)) continue;
      const page = await browser.newPage({ deviceScaleFactor: 1 });
      try {
        await page.setContent(
          `<!doctype html><html><head>
            <link rel="stylesheet" href="${css}" />
            <style>
              html, body { margin: 0; background: #fff; }
              #sample {
                display: inline-block;
                padding: 24px;
                color: #000;
                background: #fff;
                font-family: '${family}', sans-serif;
                font-size: ${cssFontSizePx}px;
                font-weight: 400;
                line-height: 1.2;
              }
            </style>
          </head><body><span id="sample">${sampleText}</span></body></html>`,
          { waitUntil: 'networkidle' },
        );
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(200);
        const buf = await page.locator('#sample').screenshot({ type: 'png' });
        const raster = decodePng(new Uint8Array(buf));
        const measured = measureGlyphShape(raster);
        if (measured === null) {
          throw new Error(`No ink for ${family}`);
        }
        const raw = measured.measurement.visualHeightPx / cssFontSizePx;
        const ratio = Number((raw * DETECTOR_RATIO_SCALE).toFixed(4));
        ratios.set(family, ratio);
        console.error(
          `calibrated ${family}: visualHeight=${measured.measurement.visualHeightPx} ` +
            `raw=${raw.toFixed(4)} × ${DETECTOR_RATIO_SCALE} → ${ratio}`,
        );
      } finally {
        await page.close();
      }
    }
  }
} finally {
  await browser.close();
}

function profile(family) {
  return {
    family,
    aliases: [],
    visualToCssRatio: ratios.get(family),
    weightBands,
  };
}

if (!writeConfigs) {
  const all = [...ratios.keys()].sort().map(profile);
  console.log(JSON.stringify({ profiles: all }, null, 2));
  process.exit(0);
}

for (const [id, kit] of Object.entries(kits.fixtures)) {
  const families = [...new Set([kit.body, kit.display])];
  const typography = {
    candidateFamilies: families,
    profiles: families.map(profile),
  };
  const dir = join(fixturesRoot, id);
  const files = (await readdir(dir)).filter(
    (f) => f.startsWith('bulwark') && f.endsWith('.config.json'),
  );
  for (const file of files) {
    const path = join(dir, file);
    const config = JSON.parse(await readFile(path, 'utf8'));
    config.typography = { ...(config.typography ?? {}), ...typography };
    await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
    console.error(`wrote typography → ${id}/${file}`);
  }
}

console.error(`done: ${ratios.size} families, configs updated (scale ${DETECTOR_RATIO_SCALE})`);
