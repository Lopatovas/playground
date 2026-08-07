/**
 * Resolves the URL of a run artifact relative to the current page.
 *
 * The dashboard never hard-codes a host: when served next to the artifacts by
 * `bulwark serve` or nginx, `/artifacts/...` is enough; when the report is passed
 * as a query string pointing at another origin, that origin wins.
 */
export declare function artifactUrl(imagePath: string, base?: string): string;
export declare function reportUrlFromLocation(search: string): string;
export declare function artifactsBaseFromReportUrl(reportUrl: string): string;
//# sourceMappingURL=urls.d.ts.map
