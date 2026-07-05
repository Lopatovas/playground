import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { LandingCompare } from "@/features/landing/landing-compare";
import { LandingCtaBand } from "@/features/landing/landing-cta-band";
import { LandingFaq } from "@/features/landing/landing-faq";
import { LandingFooter } from "@/features/landing/landing-footer";
import { LandingHowItWorks } from "@/features/landing/landing-how-it-works";
import { LandingOutcomes } from "@/features/landing/landing-outcomes";
import { LandingPreview } from "@/features/landing/landing-preview";
import { LandingProblem } from "@/features/landing/landing-problem";
import { LandingTrustBar } from "@/features/landing/landing-trust-bar";
import { api } from "@/lib/api";

export default function LandingPage() {
  const loginUrl = api.githubLoginUrl();

  return (
    <>
      <PublicHeader
        className="container landing-header"
        actions={
          <>
            <Link className="landing-header__nav" href="/curriculum">
              Curriculum
            </Link>
            <a className="landing-header__nav landing-header__nav--anchor" href="#how-it-works">
              How it works
            </a>
            <a className="landing-header__nav landing-header__nav--anchor" href="#faq">
              FAQ
            </a>
            <a className="btn btn-primary landing-header__cta" href={loginUrl}>
              Sign in with GitHub
            </a>
          </>
        }
      />

      <main>
        <section className="landing-hero">
          <div className="container landing-hero__inner">
            <div className="landing-hero__copy">
              <p className="label landing-hero__eyebrow">
                Accountability-first apprenticeship
              </p>
              <h1 className="landing-hero__title">
                Stop collecting courses.
                <span> Ship one real app.</span>
              </h1>
              <p className="landing-hero__lede">
                Track 1 — Web Systems: twelve stages from Git and the browser to
                API, SQL, auth, and a deployed full-stack app. Structure and
                accountability from us — depth and initiative from you.
              </p>

              <div className="landing-hero__actions">
                <a className="btn btn-primary btn-lg" href={loginUrl}>
                  Connect GitHub — free
                </a>
                <Link className="btn btn-ghost" href="/curriculum">
                  Preview curriculum
                </Link>
              </div>

              <p className="landing-hero__risk">
                No credit card · 12 stages live · ~2 min to start
              </p>
            </div>

            <LandingPreview />
          </div>
        </section>

        <LandingTrustBar />
        <LandingProblem />
        <LandingHowItWorks />
        <LandingOutcomes />
        <LandingCompare />
        <LandingFaq />
        <LandingCtaBand loginUrl={loginUrl} />
        <LandingFooter loginUrl={loginUrl} />
      </main>
    </>
  );
}
