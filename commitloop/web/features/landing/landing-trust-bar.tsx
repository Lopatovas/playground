const SIGNALS = [
  { value: "1 repo", label: "One evolving project — no resets" },
  { value: "GitHub", label: "Commits verified from your repo" },
  { value: "Weekends", label: "Streaks skip Sat & Sun" },
  { value: "Free", label: "Connect GitHub to start Track 1" },
];

export function LandingTrustBar() {
  return (
    <section className="landing-trust" aria-label="Product highlights">
      <div className="container landing-trust__inner">
        {SIGNALS.map((signal) => (
          <div key={signal.value} className="landing-trust__item">
            <strong>{signal.value}</strong>
            <span>{signal.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
