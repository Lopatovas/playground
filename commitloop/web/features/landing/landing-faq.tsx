import { LandingSection } from "./landing-section";

const FAQS = [
  {
    q: "Is this a bootcamp or video course?",
    a: "Neither. CommitLoop is an accountability system: curriculum tells you what to do, GitHub proves you did it. No watch-time metrics.",
  },
  {
    q: "Do I need to commit on weekends?",
    a: "No. Weekends don't break your streak. We optimize for sustainable weekday rhythm, not burnout sprints.",
  },
  {
    q: "Can I use an existing project repo?",
    a: "Yes — link the GitHub repo you're growing for the track. One evolving project, no resets mid-track.",
  },
  {
    q: "What does Track 1 cover?",
    a: "Web Systems — twelve stages: onboarding and Git, HTML/CSS and JavaScript, Express API and SQL, wiring the stack, data modeling and ORM, auth, a client UI, then tests and deploy. One repo throughout.",
  },
  {
    q: "What if I'm a complete beginner?",
    a: "Stage 0 starts at onboarding and tooling. You should already be willing to code a little; we teach the web stack outside-in, not computer science from zero.",
  },
  {
    q: "How much does it cost?",
    a: "Track 1 is free while we prove the wedge. Connect GitHub and start — no card required.",
  },
  {
    q: "What do I need to get started?",
    a: "A GitHub account, 30–60 minutes on weekdays, and a repo you commit to for the length of the track.",
  },
];

export function LandingFaq() {
  return (
    <LandingSection id="faq" variant="faq" narrow>
      <div className="landing-faq__header">
        <p className="landing-band__label">FAQ</p>
        <h2 className="landing-band__title">Questions before you connect GitHub</h2>
      </div>

      <div className="landing-faq__list">
        {FAQS.map((item) => (
          <details key={item.q} className="landing-faq__item">
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </LandingSection>
  );
}
