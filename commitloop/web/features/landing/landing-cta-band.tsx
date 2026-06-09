import Link from "next/link";

export function LandingCtaBand({ loginUrl }: { loginUrl: string }) {
  return (
    <section className="landing-cta-band">
      <div className="container landing-cta-band__inner">
        <div>
          <p className="landing-cta-band__tagline">One loop. One project. Every day.</p>
          <h2>Your next commit can be the first day you don&apos;t quit.</h2>
          <p>
            Link GitHub, get today&apos;s assignment, and start a streak that
            means something on your profile.
          </p>
        </div>
        <div className="landing-cta-band__actions">
          <a className="btn btn-primary btn-lg" href={loginUrl}>
            Connect GitHub — it&apos;s free
          </a>
          <Link className="btn btn-ghost" href="/curriculum">
            Preview Track 1 curriculum
          </Link>
        </div>
      </div>
    </section>
  );
}
