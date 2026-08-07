import type { DashboardReport } from '../lib/report-schema.js';
export interface WorkbenchProps {
  readonly report: DashboardReport;
  readonly artifactsBase: string;
}
export declare function Workbench({
  report,
  artifactsBase,
}: WorkbenchProps): import('react').JSX.Element;
//# sourceMappingURL=Workbench.d.ts.map
