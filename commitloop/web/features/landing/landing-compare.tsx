import { LandingSection } from "./landing-section";

const ROWS = [
  {
    them: "Watch hours of video",
    us: "Ship commits on your repo",
  },
  {
    them: "Ten disposable portfolio clones",
    us: "One app that evolves for months",
  },
  {
    them: "Restarts every few weeks",
    us: "One repo with stage-by-stage history",
  },
  {
    them: "No one sees when you drop off",
    us: "Deployed app you can demo in interviews",
  },
];

export function LandingCompare() {
  return (
    <LandingSection id="compare" variant="compare">
      <h2 className="landing-compare__title">
        Built for execution, not consumption.
      </h2>
      <p className="landing-compare__lede">
        Most learners restart every few weeks. Ninety days on the loop ends with
        one shipped app and habits that stick.
      </p>

      <div className="landing-compare__split">
        <div className="landing-compare__panel landing-compare__panel--them">
          <p className="landing-compare__panel-label">Without CommitLoop</p>
          <h3>Typical courses & streak apps</h3>
          <ul>
            {ROWS.map((row) => (
              <li key={row.them}>{row.them}</li>
            ))}
          </ul>
        </div>

        <div className="landing-compare__panel landing-compare__panel--us">
          <p className="landing-compare__panel-label">With CommitLoop</p>
          <h3>Accountability + curriculum</h3>
          <ul>
            {ROWS.map((row) => (
              <li key={row.us}>{row.us}</li>
            ))}
          </ul>
        </div>
      </div>
    </LandingSection>
  );
}
