export function LandingPreview() {
  return (
    <div className="landing-preview-wrap">
      <span className="landing-preview__badge" aria-hidden>
        <span className="landing-preview__badge-dot" />
        Streak alive · 12 days
      </span>

      <div className="landing-preview" aria-hidden>
        <div className="landing-preview__chrome">
          <span className="landing-preview__dot" />
          <span className="landing-preview__dot" />
          <span className="landing-preview__dot" />
          <span className="landing-preview__title">you/student-app</span>
          <span className="landing-preview__live">Live</span>
        </div>

        <div className="landing-preview__body">
          <div className="landing-preview__card landing-preview__card--wide">
            <p className="label">Today&apos;s assignment</p>
            <h3>Stage 1 — Git & Collaboration</h3>
            <p className="landing-preview__muted">
              Push meaningful commits. Add .gitignore and starter code so the
              app runs locally.
            </p>
            <span className="landing-preview__cta">Continue assignment</span>
          </div>

          <div className="landing-preview__card landing-preview__card--narrow">
            <p className="label">Commitment</p>
            <div className="landing-preview__stats">
              <div>
                <span>Today</span>
                <strong className="ok">✓</strong>
              </div>
              <div>
                <span>Streak</span>
                <strong>12</strong>
              </div>
              <div>
                <span>Longest</span>
                <strong>18</strong>
              </div>
            </div>
            <div className="landing-preview__heatmap">
              <span className="on" />
              <span className="on" />
              <span className="miss" />
              <span className="on" />
              <span className="on" />
              <span />
              <span className="today on" />
            </div>
            <p className="landing-preview__repo">you/student-app →</p>
          </div>
        </div>
      </div>
    </div>
  );
}
