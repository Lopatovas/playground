const FEATURES = [
  {
    title: "The loop",
    body: "Lesson → Sandbox → Project. Every concept lands in your codebase.",
  },
  {
    title: "One project",
    body: "No resets. Refactors and migrations count as progress.",
  },
  {
    title: "GitHub truth",
    body: "Streaks and activity come from real commits on your repo.",
  },
];

export function LandingFeatureGrid() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "1rem",
        marginTop: "3rem",
      }}
    >
      {FEATURES.map((feature) => (
        <div className="card" key={feature.title}>
          <h3 style={{ marginTop: 0 }}>{feature.title}</h3>
          <p style={{ color: "var(--muted)", margin: 0 }}>{feature.body}</p>
        </div>
      ))}
    </div>
  );
}
