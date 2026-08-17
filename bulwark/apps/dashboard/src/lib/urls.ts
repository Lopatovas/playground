/**
 * Resolves the URL of a run artifact relative to the current page.
 *
 * The dashboard never hard-codes a host: when served next to the artifacts by
 * `bulwark serve` or nginx, `/artifacts/...` is enough; when the report is passed
 * as a query string pointing at another origin, that origin wins.
 */
export function artifactUrl(imagePath: string, base = '/artifacts/'): string {
  const trimmed = imagePath.replace(/^\/+/, '');
  const normalizedBase = ensureTrailingSlash(base);

  // Relative bases stay relative so the browser resolves them against the page.
  // Absolute bases go through URL so a report hosted on another origin still works.
  if (/^https?:\/\//i.test(normalizedBase)) {
    return new URL(trimmed, normalizedBase).toString();
  }

  const prefix = normalizedBase.startsWith('/') ? normalizedBase : `/${normalizedBase}`;
  return `${prefix}${trimmed}`;
}

export function reportUrlFromLocation(search: string): string {
  const params = new URLSearchParams(search);
  return params.get('report') ?? '/artifacts/report.json';
}

export function artifactsBaseFromReportUrl(reportUrl: string): string {
  // API reports live at /api/runs/:id/report; images are siblings under /artifacts/.
  const apiReport = reportUrl.match(/^(.*\/runs\/[^/?#]+)\/report\/?(?:[?#].*)?$/i);
  if (apiReport !== null) {
    return `${apiReport[1]}/artifacts/`;
  }

  if (/^https?:\/\//i.test(reportUrl)) {
    const url = new URL(reportUrl);
    const path = url.pathname.endsWith('/') ? url.pathname : url.pathname.replace(/[^/]+$/, '');
    return `${url.origin}${path}`;
  }

  const withoutQuery = reportUrl.split(/[?#]/, 2)[0] ?? reportUrl;
  if (withoutQuery.endsWith('/')) return withoutQuery;
  const slash = withoutQuery.lastIndexOf('/');
  return slash <= 0 ? '/artifacts/' : withoutQuery.slice(0, slash + 1);
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}
