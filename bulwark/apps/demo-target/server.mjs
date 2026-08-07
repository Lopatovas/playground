/* global console, process, URL */

import { createReadStream } from 'node:fs';
import { access, readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const host = process.env.HOST ?? '0.0.0.0';
const root = fileURLToPath(new URL('.', import.meta.url));

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
]);

const server = createServer(async (request, response) => {
  if (request.url === undefined) {
    response.writeHead(400).end('missing url');
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
  if (url.pathname === '/' || url.pathname === '/correct' || url.pathname === '/broken') {
    await serveLandingPage(url, response);
    return;
  }

  await serveStaticFile(url.pathname, response);
});

server.listen(port, host, () => {
  console.log(`demo target listening at http://${host}:${port}`);
});

async function serveLandingPage(url, response) {
  const baseline = url.pathname === '/broken' ? 'broken' : 'correct';
  const defects = {
    heading: resolveDefect(url.searchParams, baseline, 'heading', 'headingSize'),
    spacing: resolveDefect(url.searchParams, baseline, 'spacing', 'ctaSpacing'),
    button: resolveDefect(url.searchParams, baseline, 'button', 'buttonColor'),
  };

  const classes = Object.entries(defects)
    .filter(([, value]) => value === 'broken')
    .map(([name]) => `defect-${name}`)
    .join(' ');

  const template = await readFile(join(root, 'index.html'), 'utf8');
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(
    template
      .replaceAll('__PAGE_CLASSES__', classes)
      .replaceAll('__PAGE_VARIANT__', baseline)
      .replaceAll('__DEFECT_SUMMARY__', summarizeDefects(defects)),
  );
}

async function serveStaticFile(pathname, response) {
  const safePath = normalize(pathname)
    .replace(/^[/\\]+/, '')
    .replace(/^(\.\.[/\\])+/, '');
  const filePath = join(root, safePath);

  try {
    await access(filePath);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
    return;
  }

  response.writeHead(200, {
    'content-type': contentTypes.get(extname(filePath)) ?? 'application/octet-stream',
  });
  createReadStream(filePath).pipe(response);
}

function resolveDefect(searchParams, baseline, ...names) {
  for (const name of names) {
    const value = searchParams.get(name);
    if (value === 'broken' || value === '1' || value === 'true') return 'broken';
    if (value === 'correct' || value === '0' || value === 'false') return 'correct';
  }
  return baseline;
}

function summarizeDefects(defects) {
  const active = Object.entries(defects)
    .filter(([, value]) => value === 'broken')
    .map(([name]) => name);

  return active.length === 0 ? 'correct layout' : `seeded defects: ${active.join(', ')}`;
}
