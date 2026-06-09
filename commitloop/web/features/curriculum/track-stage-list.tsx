import type { Assignment } from "@/lib/api";

export function TrackStageList({ stages }: { stages: Assignment["track"] }) {
  return (
    <div className="card">
      {stages.map((stage) => (
        <div key={stage.slug} className="stage-row">
          <span>{stage.status === "locked" ? "○" : "●"}</span>
          <span
            style={{
              color: stage.status === "locked" ? "var(--muted)" : "inherit",
              fontWeight: stage.status === "current" ? 600 : 400,
            }}
          >
            {stage.title}
          </span>
          <span className={`pill pill-${stage.status}`}>{stage.status}</span>
        </div>
      ))}
    </div>
  );
}
