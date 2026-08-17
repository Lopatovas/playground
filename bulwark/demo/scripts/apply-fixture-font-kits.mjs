/**
 * Apply demo/fixtures/font-kits.json to demo-target HTML + CSS page vars.
 *
 * Usage (from bulwark/):
 *   node demo/scripts/apply-fixture-font-kits.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const kitsPath = join(repoRoot, 'demo/fixtures/font-kits.json');
const demoTarget = join(repoRoot, 'apps/demo-target');
const fixturesCssPath = join(demoTarget, 'fixtures.css');
const stylesCssPath = join(demoTarget, 'styles.css');

const kits = JSON.parse(await readFile(kitsPath, 'utf8'));

const linkRe =
  /<link\n\s*href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"\n\s*rel="stylesheet"\n\s*\/>/;

for (const [id, kit] of Object.entries(kits.fixtures)) {
  const htmlFiles = Array.isArray(kit.html) ? kit.html : [kit.html];
  const link = `    <link\n      href="${kit.googleCss}"\n      rel="stylesheet"\n    />`;
  for (const file of htmlFiles) {
    const path = join(demoTarget, file);
    let html = await readFile(path, 'utf8');
    if (!linkRe.test(html)) {
      // single-line variant
      const alt = /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"\s+rel="stylesheet"\s*\/>/;
      if (alt.test(html)) {
        html = html.replace(alt, link.trim());
      } else {
        throw new Error(`No Google Fonts link found in ${file} (${id})`);
      }
    } else {
      html = html.replace(linkRe, link.trim());
    }
    await writeFile(path, html);
    console.log(`html ${file} → ${kit.body} / ${kit.display}`);
  }
}

const cssBlock = Object.entries(kits.fixtures)
  .map(([id, kit]) => {
    const body = cssStack(kit.body);
    const display = cssStack(kit.display);
    return `/* font-kit: ${id} */\n.${kit.pageClass} {\n  --font-body: ${body};\n  --font-display: ${display};\n}`;
  })
  .join('\n\n');

const markerStart = '/* ---- fixture font kits (generated) ---- */';
const markerEnd = '/* ---- end fixture font kits ---- */';
const generated = `${markerStart}\n${cssBlock}\n${markerEnd}\n`;

let fixturesCss = await readFile(fixturesCssPath, 'utf8');
if (fixturesCss.includes(markerStart)) {
  fixturesCss = fixturesCss.replace(
    new RegExp(`${escapeReg(markerStart)}[\\s\\S]*?${escapeReg(markerEnd)}\\n?`),
    generated,
  );
} else {
  fixturesCss = `${generated}\n${fixturesCss}`;
}
await writeFile(fixturesCssPath, fixturesCss);
console.log('updated fixtures.css font-kit block');

// landing uses styles.css :root — override via page-landing already in fixtures block;
// also set page-landing in styles if present without fixtures import order issues.
let styles = await readFile(stylesCssPath, 'utf8');
if (!styles.includes('/* font-kit: landing override */')) {
  styles += `\n/* font-kit: landing override */\n.page-landing {\n  --font-body: ${cssStack('Open Sans')};\n  --font-display: ${cssStack('Open Sans')};\n}\n`;
  await writeFile(stylesCssPath, styles);
  console.log('appended page-landing font override to styles.css');
}

function cssStack(family) {
  const generic =
    family.includes('Serif') || family.includes('Cormorant') || family.includes('Garamond')
      ? 'serif'
      : 'sans-serif';
  return `'${family}', ${generic}`;
}

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
