import type { MentorStudent } from "@/lib/api";

const ATTENTION_LABEL: Record<MentorStudent["attention"], string> = {
  ok: "On track",
  missed_today: "Missed today",
  no_repo: "No repo",
  inactive: "No commits yet",
};

export function MentorStudentTable({
  students,
}: {
  students: MentorStudent[];
}) {
  if (students.length === 0) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)" }}>
          No students yet. They appear here after signing in with GitHub.
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="mentor-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Stage / step</th>
            <th>Streak</th>
            <th>Today</th>
            <th>Status</th>
            <th>Repo</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr
              key={student.id}
              className={
                student.attention === "missed_today"
                  ? "mentor-row--alert"
                  : undefined
              }
            >
              <td>
                <div className="mentor-table__student">
                  {student.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- GitHub avatar URLs are external
                    <img
                      src={student.avatarUrl}
                      alt=""
                      className="mentor-table__avatar"
                    />
                  ) : null}
                  <span>@{student.username}</span>
                </div>
              </td>
              <td>
                <div>{student.stageTitle}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  {student.currentStep}
                  {student.quizPassed ? " · quiz passed" : ""}
                </div>
              </td>
              <td>
                {student.streak?.configured
                  ? student.streak.currentStreak
                  : "—"}
              </td>
              <td>
                {!student.streak?.configured
                  ? "—"
                  : student.streak.activeToday
                    ? "✓"
                    : student.streak.missedToday
                      ? "✗"
                      : "—"}
              </td>
              <td>
                <span
                  className={
                    student.attention === "missed_today"
                      ? "mentor-badge mentor-badge--alert"
                      : "mentor-badge"
                  }
                >
                  {ATTENTION_LABEL[student.attention]}
                </span>
              </td>
              <td>
                {student.repoUrl ? (
                  <a href={student.repoUrl} target="_blank" rel="noreferrer">
                    {student.repo?.owner}/{student.repo?.name} →
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
