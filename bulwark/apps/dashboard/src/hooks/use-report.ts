import { useCallback, useEffect, useState } from 'react';
import { parseReport } from '../lib/report-schema.js';
import type { DashboardReport } from '../lib/report-schema.js';
import { artifactsBaseFromReportUrl, reportUrlFromLocation } from '../lib/urls.js';

export type ReportLoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string; issues?: readonly string[] }
  | { status: 'ready'; report: DashboardReport; artifactsBase: string };

/**
 * Loads and validates the report the workbench is reviewing.
 *
 * The URL is the only configuration: `?report=` points at a specific run, and the
 * artifact images are resolved next to that report. That keeps the dashboard a static
 * bundle that works the same under `bulwark serve`, nginx, or a CI artifact host.
 */
export function useReport(search: string = typeof window === 'undefined' ? '' : window.location.search): ReportLoadState {
  const [state, setState] = useState<ReportLoadState>({ status: 'loading' });
  const reportUrl = reportUrlFromLocation(search);

  const load = useCallback(async (signal: AbortSignal) => {
    setState({ status: 'loading' });
    try {
      const response = await fetch(reportUrl, { signal });
      if (!response.ok) {
        setState({
          status: 'error',
          message: `Could not load the report at ${reportUrl} (HTTP ${response.status}).`,
        });
        return;
      }
      const payload: unknown = await response.json();
      const parsed = parseReport(payload);
      if (!parsed.ok) {
        setState({ status: 'error', message: parsed.message, issues: parsed.issues });
        return;
      }
      setState({
        status: 'ready',
        report: parsed.report,
        artifactsBase: artifactsBaseFromReportUrl(reportUrl),
      });
    } catch (error) {
      if (signal.aborted) return;
      setState({
        status: 'error',
        message:
          error instanceof Error
            ? `Could not load the report: ${error.message}`
            : 'Could not load the report.',
      });
    }
  }, [reportUrl]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return state;
}
