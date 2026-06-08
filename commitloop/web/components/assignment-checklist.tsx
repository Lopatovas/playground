import type { Assignment } from "@/lib/api";

export function AssignmentChecklist({
  allDone,
  busy,
  items,
  onAdvance,
  onToggle,
}: {
  allDone: boolean;
  busy: boolean;
  items: Assignment["checklist"];
  onAdvance: () => void;
  onToggle: (id: string, done: boolean) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="card" style={{ marginBottom: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>Checklist</h3>
      <ul className="checklist">
        {items.map((item) => (
          <li key={item.id}>
            <input
              type="checkbox"
              checked={item.done}
              disabled={busy}
              onChange={(e) => onToggle(item.id, e.target.checked)}
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
      {allDone ? (
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: "1rem" }}
          disabled={busy}
          onClick={onAdvance}
        >
          Advance to next stage
        </button>
      ) : null}
    </div>
  );
}
