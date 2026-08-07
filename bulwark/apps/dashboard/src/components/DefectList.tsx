import type { DashboardDefect } from '../lib/report-schema.js';
import { DEFECT_TYPE_LABELS, filterDefects } from '../lib/defects.js';
import type { DefectFilter } from '../lib/defects.js';
import { DEFAULT_DEFECT_FILTER } from '../lib/defects.js';
import { useMemo, useState } from 'react';

export interface DefectListProps {
  readonly defects: readonly DashboardDefect[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
}

export function DefectList({ defects, selectedId, onSelect }: DefectListProps) {
  const [filter, setFilter] = useState<DefectFilter>(DEFAULT_DEFECT_FILTER);
  const visible = useMemo(() => filterDefects(defects, filter), [defects, filter]);

  return (
    <aside className="defect-list" aria-label="Defects">
      <header className="defect-list__header">
        <h2>
          Defects <span className="defect-list__count">{visible.length}</span>
        </h2>
        <div className="defect-list__filters">
          <label>
            <span className="sr-only">Severity</span>
            <select
              value={filter.severity}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  severity: event.target.value as DefectFilter['severity'],
                }))
              }
            >
              <option value="all">All severities</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Type</span>
            <select
              value={filter.type}
              onChange={(event) =>
                setFilter((current) => ({
                  ...current,
                  type: event.target.value as DefectFilter['type'],
                }))
              }
            >
              <option value="all">All types</option>
              {Object.entries(DEFECT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="defect-list__search">
            <span className="sr-only">Search</span>
            <input
              type="search"
              placeholder="Filter defects"
              value={filter.query}
              onChange={(event) =>
                setFilter((current) => ({ ...current, query: event.target.value }))
              }
            />
          </label>
        </div>
      </header>

      {visible.length === 0 ? (
        <p className="defect-list__empty">
          {defects.length === 0
            ? 'No defects — the surfaces match.'
            : 'No defects match this filter.'}
        </p>
      ) : (
        <ul className="defect-list__items">
          {visible.map((defect) => {
            const selected = defect.id === selectedId;
            return (
              <li key={defect.id}>
                <button
                  type="button"
                  className={`defect-item defect-item--${defect.severity}${selected ? ' defect-item--selected' : ''}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(selected ? null : defect.id)}
                >
                  <span className="defect-item__meta">
                    <span className="defect-item__severity">{defect.severity}</span>
                    <span className="defect-item__type">
                      {DEFECT_TYPE_LABELS[defect.type] ?? defect.type}
                    </span>
                  </span>
                  <span className="defect-item__message">{defect.message}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
