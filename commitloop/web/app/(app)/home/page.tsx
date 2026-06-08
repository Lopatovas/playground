"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StreakPanel } from "@/components/streak-panel";
import { api, type Assignment, type StreakStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [repo, setRepo] = useState<{ owner: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.assignment(), api.streak()])
      .then(([nextAssignment, nextStreak]) => {
        if (cancelled) return;

        setAssignment(nextAssignment);
        if (nextStreak.configured && nextStreak.stats) {
          setStreak(nextStreak.stats);
          setRepo(nextStreak.repo ?? user?.repo ?? null);
        } else if (!user?.repo) {
          router.push("/settings");
        }
      })
      .catch(() => router.push("/"));

    return () => {
      cancelled = true;
    };
  }, [router, user?.repo]);

  if (!assignment) {
    return <div style={{ padding: "2rem 0" }}>Loading…</div>;
  }

  return (
    <>
      <div className="home-grid">
        <div className="card">
          <div className="label">Today&apos;s assignment</div>
          <h2 style={{ margin: "0.5rem 0 0.25rem" }}>{assignment.stage.title}</h2>
          <p style={{ color: "var(--muted)", margin: "0 0 1rem" }}>
            Step: {assignment.stepLabel}
          </p>
          <p style={{ margin: "0 0 1.25rem" }}>{assignment.summary}</p>
          <Link className="btn btn-primary" href="/assignment">
            Continue assignment
          </Link>
        </div>

        {streak ? (
          <StreakPanel stats={streak} repo={repo ?? undefined} />
        ) : (
          <div className="card">
            <div className="label">Commitment</div>
            <p style={{ color: "var(--muted)" }}>
              <Link href="/settings">Connect a repo</Link> to track your streak.
            </p>
          </div>
        )}
      </div>

      <p style={{ marginTop: "1.25rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        {assignment.nextHint}
      </p>
    </>
  );
}
