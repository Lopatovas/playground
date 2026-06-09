import Link from "next/link";
import type { Assignment } from "@/lib/api";

export function AssignmentSummaryCard({
  assignment,
}: {
  assignment: Assignment;
}) {
  return (
    <div className="card">
      <div className="label">Today&apos;s assignment</div>
      <h2 style={{ margin: "0.5rem 0 0.25rem" }}>{assignment.stage.title}</h2>
      <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>
        Step: {assignment.stepLabel}
      </p>
      <p style={{ margin: "0 0 1.25rem" }}>{assignment.summary}</p>
      <Link className="btn btn-primary" href="/assignment">
        Continue assignment
      </Link>
    </div>
  );
}
