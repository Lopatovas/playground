import Link from "next/link";
import { Logo } from "@/components/logo";

export function LandingFooter({ loginUrl }: { loginUrl: string }) {
  return (
    <footer className="landing-footer">
      <div className="container landing-footer__inner">
        <Logo href="/" />
        <nav className="landing-footer__nav" aria-label="Footer">
          <Link href="/curriculum">Curriculum</Link>
          <a href="#how-it-works">How it works</a>
          <a href="#faq">FAQ</a>
          <a href={loginUrl}>Sign in</a>
        </nav>
        <p className="landing-footer__tagline">One loop. One project. Every day.</p>
      </div>
    </footer>
  );
}
