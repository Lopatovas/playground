import type { DashboardDefect } from '../lib/report-schema.js';
export interface DefectListProps {
  readonly defects: readonly DashboardDefect[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}
export declare function DefectList({
  defects,
  selectedId,
  onSelect,
}: DefectListProps): import('react').JSX.Element;
//# sourceMappingURL=DefectList.d.ts.map
