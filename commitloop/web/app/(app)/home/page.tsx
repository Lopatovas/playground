"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentSummaryCard } from "@/components/assignment-summary-card";
import { CommitmentSetupCard } from "@/components/commitment-setup-card";
import { LoadingState } from "@/components/loading-state";
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
    return <LoadingState />;
  }

  return (
    <>
      <div className="home-grid">
        <AssignmentSummaryCard assignment={assignment} />

        {streak ? (
          <StreakPanel stats={streak} repo={repo ?? undefined} />
        ) : (
          <CommitmentSetupCard />
        )}
      </div>

      <p
        style={{
          marginTop: "1.25rem",
          color: "var(--muted)",
          fontSize: "0.9rem",
        }}
      >
        {assignment.nextHint}
      </p>
    </>
  );
}
