const FEATURES = [
  {
    num: "1",
    title: "The loop",
    body: "Lesson → Sandbox → Project. Every concept lands in your codebase.",
  },
  {
    num: "2",
    title: "One project",
    body: "No resets. Refactors and migrations count as progress.",
  },
  {
    num: "3",
    title: "GitHub truth",
    body: "Streaks and activity come from real commits on your repo.",
  },
];

export function LandingFeatureGrid() {
  return (
    <div className="landing-features">
      {FEATURES.map((feature) => (
        <article className="landing-feature card" key={feature.title}>
          <span className="landing-feature__num">{feature.num}</span>
          <h3>{feature.title}</h3>
          <p>{feature.body}</p>
        </article>
      ))}
    </div>
  );
}
