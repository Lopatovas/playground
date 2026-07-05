import { LandingSection } from "./landing-section";

const STEPS = [
  {
    step: "01",
    title: "Connect your repo",
    body: "Link the GitHub project you'll grow for the whole track.",
  },
  {
    step: "02",
    title: "Follow today's assignment",
    body: "Lesson → Sandbox → Quiz → Project. Every concept lands in your codebase.",
  },
  {
    step: "03",
    title: "Commit every weekday",
    body: "GitHub is the record. Weekends don't break your streak.",
  },
];

export function LandingHowItWorks() {
  return (
    <LandingSection id="how-it-works" variant="process">
      <div className="landing-loop__header">
        <p className="landing-band__label">How it works</p>
        <h2 className="landing-band__title">Three moves. One loop.</h2>
      </div>

      <div className="landing-loop">
        {STEPS.map((item, index) => (
          <div key={item.step} className="landing-loop__segment">
            <div className="landing-loop__step">
              <span className="landing-loop__num">{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </div>
            {index < STEPS.length - 1 ? (
              <span className="landing-loop__arrow" aria-hidden>
                →
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </LandingSection>
  );
}
