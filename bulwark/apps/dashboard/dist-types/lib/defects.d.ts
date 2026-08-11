import type { DashboardDefect, DefectSeverity, DefectType } from './report-schema.js';
export type DefectFilter = {
    readonly severity: 'all' | DefectSeverity;
    readonly type: 'all' | DefectType;
    readonly query: string;
};
export declare const DEFAULT_DEFECT_FILTER: DefectFilter;
/**
 * Filters and keeps the report's severity/type order intact.
 *
 * The report already sorts defects for stable diffs; the dashboard must not
 * reshuffle them or selecting one defect and filtering another would jump the
 * highlight under the reviewer's cursor.
 */
export declare function filterDefects(defects: readonly DashboardDefect[], filter: DefectFilter): DashboardDefect[];
export declare function defectHighlightBox(defect: DashboardDefect): {
    surface: 'design' | 'live';
    box: NonNullable<DashboardDefect['designBox']>;
} | null;
export declare const DEFECT_TYPE_LABELS: Readonly<Record<DefectType, string>>;
//# sourceMappingURL=defects.d.ts.map