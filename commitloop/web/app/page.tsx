import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { LandingFeatureGrid } from "@/features/landing/landing-feature-grid";
import { api } from "@/lib/api";

export default function LandingPage() {
  return (
    <>
      <PublicHeader className="container" style={{ padding: "1.25rem 0" }} />

      <main className="container" style={{ padding: "2.5rem 0 4rem" }}>
        <p className="label">Accountability-first apprenticeship</p>
        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            lineHeight: 1.15,
            maxWidth: "14ch",
            margin: "0.75rem 0 1rem",
            letterSpacing: "-0.02em",
          }}
        >
          Build one real app. Show up every day.
        </h1>
        <p
          style={{
            color: "var(--muted)",
            maxWidth: "48ch",
            fontSize: "1.1rem",
          }}
        >
          One evolving project. Daily commits. GitHub is the record — not watch
          time.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
          <a className="btn btn-primary" href={api.githubLoginUrl()}>
            Connect GitHub
          </a>
          <Link className="btn btn-ghost" href="/curriculum">
            View curriculum
          </Link>
        </div>

        <LandingFeatureGrid />
      </main>
    </>
  );
}
