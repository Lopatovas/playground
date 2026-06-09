import { LandingSection } from "./landing-section";

const OUTCOMES = [
  {
    tag: "Focus",
    title: "Know exactly what to do today",
    body: "Assignment-first home: stage, step, and checklist — not an overwhelming syllabus.",
    metric: "Lesson → Sandbox → Project",
    featured: true,
  },
  {
    tag: "Proof",
    title: "Build a Git history that hires",
    body: "Every stage lands in one repo. Refactors, migrations, and fixes count as progress.",
    metric: "Meaningful commits only",
    featured: false,
  },
  {
    tag: "Rhythm",
    title: "Show up on weekdays, breathe on weekends",
    body: "Streaks track real work. Miss a weekday and you feel it. Weekends don't break the chain.",
    metric: "7-day heatmap + streak",
    featured: false,
  },
];

export function LandingOutcomes() {
  return (
    <LandingSection id="outcomes" variant="outcomes">
      <div className="landing-outcomes__header">
        <p className="landing-band__label">What you get</p>
        <h2 className="landing-band__title">Consistency, accountability, skill.</h2>
        <p className="landing-outcomes__lede">
          Structured learning that ends in your codebase, not a certificate.
        </p>
      </div>

      <div className="landing-outcomes__bento">
        {OUTCOMES.map((outcome) => (
          <article
            key={outcome.title}
            className={`landing-outcome${outcome.featured ? " landing-outcome--featured" : ""}`}
          >
            <span className="landing-outcome__tag">{outcome.tag}</span>
            <h3>{outcome.title}</h3>
            <p>{outcome.body}</p>
            <code className="landing-outcome__metric">{outcome.metric}</code>
          </article>
        ))}
      </div>
    </LandingSection>
  );
}
