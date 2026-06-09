import { LandingSection } from "./landing-section";

const PAINS = [
  {
    num: "01",
    title: "Tutorial graveyard",
    body: "You finish courses but never ship. Another cloned todo app dies in a folder.",
  },
  {
    num: "02",
    title: "No external structure",
    body: "You know what to learn — not what to do today. Motivation fades in week two.",
  },
  {
    num: "03",
    title: "Empty GitHub profile",
    body: "Recruiters see certificates, not commits. No proof you can sustain building.",
  },
];

export function LandingProblem() {
  return (
    <LandingSection id="why" variant="problem">
      <div className="landing-problem__layout">
        <div className="landing-problem__intro">
          <p className="landing-band__label">The real problem</p>
          <h2 className="landing-band__title">
            You don&apos;t need another course.
          </h2>
          <p className="landing-problem__lede">
            You need a system that tells you what to build today and holds you
            to it — with GitHub as the receipt.
          </p>
        </div>

        <div className="landing-problem__grid">
          {PAINS.map((pain) => (
            <article key={pain.title} className="landing-problem__card">
              <span className="landing-problem__num">{pain.num}</span>
              <h3>{pain.title}</h3>
              <p>{pain.body}</p>
            </article>
          ))}
        </div>
      </div>
    </LandingSection>
  );
}
