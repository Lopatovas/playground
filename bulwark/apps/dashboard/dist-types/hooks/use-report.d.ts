import type { DashboardReport } from '../lib/report-schema.js';
export type ReportLoadState = {
    status: 'loading';
} | {
    status: 'error';
    message: string;
    issues?: readonly string[];
} | {
    status: 'ready';
    report: DashboardReport;
    artifactsBase: string;
};
/**
 * Loads and validates the report the workbench is reviewing.
 *
 * The URL is the only configuration: `?report=` points at a specific run, and the
 * artifact images are resolved next to that report. That keeps the dashboard a static
 * bundle that works the same under `bulwark serve`, nginx, or a CI artifact host.
 */
export declare function useReport(search?: string): ReportLoadState;
//# sourceMappingURL=use-report.d.ts.map