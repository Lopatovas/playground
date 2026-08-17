import type { DashboardDefect, DefectSeverity, DefectType } from './report-schema.js';

export type DefectFilter = {
  readonly severity: 'all' | DefectSeverity;
  readonly type: 'all' | DefectType;
  readonly query: string;
};

export const DEFAULT_DEFECT_FILTER: DefectFilter = {
  severity: 'all',
  type: 'all',
  query: '',
};

/**
 * Filters and keeps the report's severity/type order intact.
 *
 * The report already sorts defects for stable diffs; the dashboard must not
 * reshuffle them or selecting one defect and filtering another would jump the
 * highlight under the reviewer's cursor.
 */
export function filterDefects(
  defects: readonly DashboardDefect[],
  filter: DefectFilter,
): DashboardDefect[] {
  const query = filter.query.trim().toLowerCase();
  return defects.filter((defect) => {
    if (filter.severity !== 'all' && defect.severity !== filter.severity) return false;
    if (filter.type !== 'all' && defect.type !== filter.type) return false;
    if (query.length === 0) return true;
    return (
      defect.message.toLowerCase().includes(query) ||
      defect.id.toLowerCase().includes(query) ||
      defect.type.toLowerCase().includes(query) ||
      (defect.designElementId?.toLowerCase().includes(query) ?? false)
    );
  });
}

export function defectHighlightBox(
  defect: DashboardDefect,
): { surface: 'design' | 'live'; box: NonNullable<DashboardDefect['designBox']> } | null {
  if (defect.designBox !== undefined) return { surface: 'design', box: defect.designBox };
  if (defect.liveBox !== undefined) return { surface: 'live', box: defect.liveBox };
  return null;
}

export const DEFECT_TYPE_LABELS: Readonly<Record<DefectType, string>> = {
  spacing: 'Spacing',
  position: 'Position',
  'missing-element': 'Missing',
  'unexpected-element': 'Unexpected',
  'font-size': 'Font size',
  'font-weight': 'Font weight',
  'font-family': 'Font family',
  color: 'Color',
};
