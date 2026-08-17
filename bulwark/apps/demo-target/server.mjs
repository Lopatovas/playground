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
  ['.json', 'application/json; charset=utf-8'],
]);

/**
 * Fixture pages served by the demo target.
 * Manifests (expected leaves / seeds) live under demo/fixtures/<id>/manifest.json.
 */
const FIXTURES = [
  {
    id: 'landing',
    template: 'landing.html',
    correctPath: '/landing',
    brokenPath: '/landing-broken',
    defectNames: ['heading', 'spacing', 'button'],
    aliases: {
      heading: ['heading', 'headingSize'],
      spacing: ['spacing', 'ctaSpacing'],
      button: ['button', 'buttonColor'],
    },
  },
  {
    id: 'workspace',
    template: 'workspace.html',
    correctPath: '/workspace',
    brokenPath: '/workspace-broken',
    defectNames: [
      'heading-size',
      'card-gap',
      'nav-spacing',
      'primary-color',
      'panel-shift',
      'signin-font',
    ],
    aliases: {
      'heading-size': ['heading-size', 'headingSize'],
      'card-gap': ['card-gap', 'cardGap'],
      'nav-spacing': ['nav-spacing', 'navSpacing'],
      'primary-color': ['primary-color', 'primaryColor', 'button'],
      'panel-shift': ['panel-shift', 'panelShift'],
      'signin-font': ['signin-font', 'signinFont', 'sign-in-font'],
    },
  },
  {
    id: 'admin',
    template: 'admin.html',
    correctPath: '/admin',
    brokenPath: '/admin-broken',
    defectNames: ['title-size', 'col-shift', 'row-gap', 'new-color', 'side-spacing'],
    aliases: {
      'title-size': ['title-size', 'titleSize'],
      'col-shift': ['col-shift', 'colShift'],
      'row-gap': ['row-gap', 'rowGap'],
      'new-color': ['new-color', 'newColor'],
      'side-spacing': ['side-spacing', 'sideSpacing'],
    },
  },
  {
    id: 'settings',
    template: 'settings.html',
    correctPath: '/settings',
    brokenPath: '/settings-broken',
    defectNames: ['title-size', 'label-gap', 'save-color', 'pref-shift'],
    aliases: {
      'title-size': ['title-size', 'titleSize'],
      'label-gap': ['label-gap', 'labelGap'],
      'save-color': ['save-color', 'saveColor'],
      'pref-shift': ['pref-shift', 'prefShift'],
    },
  },
  {
    id: 'mobile-feed',
    template: 'mobile-feed.html',
    correctPath: '/mobile-feed',
    brokenPath: '/mobile-feed-broken',
    defectNames: ['title-size', 'card-gap', 'tab-shift', 'accent'],
    aliases: {
      'title-size': ['title-size', 'titleSize'],
      'card-gap': ['card-gap', 'cardGap'],
      'tab-shift': ['tab-shift', 'tabShift'],
      accent: ['accent', 'accentColor'],
    },
  },
  {
    id: 'brand-hero',
    template: 'brand-hero.html',
    correctPath: '/brand-hero',
    brokenPath: '/brand-hero-broken',
    defectNames: ['cta-color', 'headline-ink', 'badge-color', 'link-ink'],
    aliases: {
      'cta-color': ['cta-color', 'ctaColor'],
      'headline-ink': ['headline-ink', 'headlineInk'],
      'badge-color': ['badge-color', 'badgeColor'],
      'link-ink': ['link-ink', 'linkInk'],
    },
  },
  {
    id: 'pricing',
    template: 'pricing.html',
    correctPath: '/pricing',
    brokenPath: '/pricing-broken',
    defectNames: ['pill-color', 'pro-cta', 'price-ink', 'starter-cta'],
    aliases: {
      'pill-color': ['pill-color', 'pillColor'],
      'pro-cta': ['pro-cta', 'proCta'],
      'price-ink': ['price-ink', 'priceInk'],
      'starter-cta': ['starter-cta', 'starterCta'],
    },
  },
  {
    id: 'dashboard-vivid',
    template: 'dashboard-vivid.html',
    correctPath: '/dashboard-vivid',
    brokenPath: '/dashboard-vivid-broken',
    defectNames: ['kpi-teal', 'kpi-coral', 'kpi-amber', 'value-ink'],
    aliases: {
      'kpi-teal': ['kpi-teal', 'kpiTeal'],
      'kpi-coral': ['kpi-coral', 'kpiCoral'],
      'kpi-amber': ['kpi-amber', 'kpiAmber'],
      'value-ink': ['value-ink', 'valueInk'],
    },
  },
  {
    id: 'promo-mobile',
    template: 'promo-mobile.html',
    correctPath: '/promo-mobile',
    brokenPath: '/promo-mobile-broken',
    defectNames: ['cta-color', 'title-ink', 'accent-ink', 'chip-color'],
    aliases: {
      'cta-color': ['cta-color', 'ctaColor'],
      'title-ink': ['title-ink', 'titleInk'],
      'accent-ink': ['accent-ink', 'accentInk'],
      'chip-color': ['chip-color', 'chipColor'],
    },
  },
  {
    id: 'eshop',
    template: 'eshop.html',
    correctPath: '/eshop',
    brokenPath: '/eshop-broken',
    defectNames: ['atc-color', 'sale-badge', 'price-ink', 'star-ink', 'swatch-fill'],
    aliases: {
      'atc-color': ['atc-color', 'atcColor'],
      'sale-badge': ['sale-badge', 'saleBadge'],
      'price-ink': ['price-ink', 'priceInk'],
      'star-ink': ['star-ink', 'starInk'],
      'swatch-fill': ['swatch-fill', 'swatchFill'],
    },
  },
  {
    id: 'marketplace',
    template: 'marketplace.html',
    correctPath: '/marketplace',
    brokenPath: '/marketplace-broken',
    defectNames: ['deal-badge', 'new-badge', 'price-ink', 'cta-color'],
    aliases: {
      'deal-badge': ['deal-badge', 'dealBadge'],
      'new-badge': ['new-badge', 'newBadge'],
      'price-ink': ['price-ink', 'priceInk'],
      'cta-color': ['cta-color', 'ctaColor'],
    },
  },
  {
    id: 'food-delivery',
    template: 'food-delivery.html',
    correctPath: '/food-delivery',
    brokenPath: '/food-delivery-broken',
    defectNames: ['chip-color', 'tag-color', 'free-ink', 'cart-color'],
    aliases: {
      'chip-color': ['chip-color', 'chipColor'],
      'tag-color': ['tag-color', 'tagColor'],
      'free-ink': ['free-ink', 'freeInk'],
      'cart-color': ['cart-color', 'cartColor'],
    },
  },
  {
    id: 'booking',
    template: 'booking.html',
    correctPath: '/booking',
    brokenPath: '/booking-broken',
    defectNames: ['cta-color', 'day-fill', 'badge-color', 'link-ink'],
    aliases: {
      'cta-color': ['cta-color', 'ctaColor'],
      'day-fill': ['day-fill', 'dayFill'],
      'badge-color': ['badge-color', 'badgeColor'],
      'link-ink': ['link-ink', 'linkInk'],
    },
  },
  {
    id: 'fintech',
    template: 'fintech.html',
    correctPath: '/fintech',
    brokenPath: '/fintech-broken',
    defectNames: ['cta-color', 'up-ink', 'down-ink', 'alert-ink'],
    aliases: {
      'cta-color': ['cta-color', 'ctaColor'],
      'up-ink': ['up-ink', 'upInk'],
      'down-ink': ['down-ink', 'downInk'],
      'alert-ink': ['alert-ink', 'alertInk'],
    },
  },
  {
    id: 'docs',
    template: 'docs.html',
    correctPath: '/docs',
    brokenPath: '/docs-broken',
    defectNames: ['nav-ink', 'link-ink', 'pill-color', 'code-fill'],
    aliases: {
      'nav-ink': ['nav-ink', 'navInk'],
      'link-ink': ['link-ink', 'linkInk'],
      'pill-color': ['pill-color', 'pillColor'],
      'code-fill': ['code-fill', 'codeFill'],
    },
  },
  {
    id: 'portfolio',
    template: 'portfolio.html',
    correctPath: '/portfolio',
    brokenPath: '/portfolio-broken',
    defectNames: ['cta-color', 'name-ink', 'mail-ink', 'nav-ink'],
    aliases: {
      'cta-color': ['cta-color', 'ctaColor'],
      'name-ink': ['name-ink', 'nameInk'],
      'mail-ink': ['mail-ink', 'mailInk'],
      'nav-ink': ['nav-ink', 'navInk'],
    },
  },
  {
    id: 'analytics-web',
    template: 'analytics-web.html',
    correctPath: '/analytics-web',
    brokenPath: '/analytics-web-broken',
    defectNames: ['kpi-a', 'export-color', 'swatch-paid', 'up-ink', 'range-ink', 'pie-paid', 'bar-series'],
    aliases: {
      'kpi-a': ['kpi-a', 'kpiA'],
      'export-color': ['export-color', 'exportColor'],
      'swatch-paid': ['swatch-paid', 'swatchPaid'],
      'up-ink': ['up-ink', 'upInk'],
      'range-ink': ['range-ink', 'rangeInk'],
      'pie-paid': ['pie-paid', 'piePaid'],
      'bar-series': ['bar-series', 'barSeries'],
    },
  },
  {
    id: 'analytics-mobile',
    template: 'analytics-mobile.html',
    correctPath: '/analytics-mobile',
    brokenPath: '/analytics-mobile-broken',
    defectNames: ['kpi-users', 'seg-color', 'swatch-ios', 'link-ink', 'rank-fill', 'donut-ios', 'spark-series'],
    aliases: {
      'kpi-users': ['kpi-users', 'kpiUsers'],
      'seg-color': ['seg-color', 'segColor'],
      'swatch-ios': ['swatch-ios', 'swatchIos'],
      'link-ink': ['link-ink', 'linkInk'],
      'rank-fill': ['rank-fill', 'rankFill'],
      'donut-ios': ['donut-ios', 'donutIos'],
      'spark-series': ['spark-series', 'sparkSeries'],
    },
  },
];

/** Legacy path aliases so older docs/configs keep working. */
const PATH_ALIASES = new Map([
  ['/', '/landing'],
  ['/correct', '/landing'],
  ['/broken', '/landing-broken'],
  ['/complex', '/workspace'],
  ['/complex-broken', '/workspace-broken'],
]);

const server = createServer(async (request, response) => {
  if (request.url === undefined) {
    response.writeHead(400).end('missing url');
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
  const pathname = PATH_ALIASES.get(url.pathname) ?? url.pathname;

  if (pathname === '/fixtures' || pathname === '/fixtures.json') {
    response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    response.end(
      JSON.stringify(
        {
          fixtures: FIXTURES.map((fixture) => ({
            id: fixture.id,
            correct: fixture.correctPath,
            broken: fixture.brokenPath,
            seeds: fixture.defectNames,
          })),
        },
        null,
        2,
      ),
    );
    return;
  }

  for (const fixture of FIXTURES) {
    if (pathname === fixture.correctPath || pathname === fixture.brokenPath) {
      await servePage(url, response, {
        ...fixture,
        pathname,
      });
      return;
    }
  }

  await serveStaticFile(pathname, response);
});

server.listen(port, host, () => {
  console.log(`demo target listening at http://${host}:${port}`);
  for (const fixture of FIXTURES) {
    console.log(`  ${fixture.correctPath}  ${fixture.brokenPath}`);
  }
});

async function servePage(url, response, options) {
  const baseline = options.pathname === options.brokenPath ? 'broken' : 'correct';
  const defects = {};
  for (const name of options.defectNames) {
    const aliases = options.aliases?.[name] ?? [name];
    defects[name] = resolveDefect(url.searchParams, baseline, ...aliases);
  }

  const classes = Object.entries(defects)
    .filter(([, value]) => value === 'broken')
    .map(([name]) => `defect-${name}`)
    .join(' ');

  const template = await readFile(join(root, options.template), 'utf8');
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
