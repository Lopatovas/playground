"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PublicHeader } from "@/components/public-header";
import { TrackStageList } from "@/features/curriculum/track-stage-list";
import { TrackStageListSkeleton } from "@/features/curriculum/track-stage-list-skeleton";
import { api, type Assignment } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const TRACK_ARC = [
  {
    label: "Foundations",
    stages: "0–3",
    topics: "Onboarding, Git, HTML/CSS, JavaScript",
  },
  {
    label: "Server & data",
    stages: "4–5",
    topics: "REST API, SQL & persistence",
  },
  {
    label: "Full stack",
    stages: "6–8",
    topics: "Wire UI to API, data modeling, ORM",
  },
  {
    label: "Ship",
    stages: "9–11",
    topics: "Auth, client app, tests & deploy",
  },
];

export default function CurriculumPage() {
  const { clearAuth, status, user } = useAuth();
  const [track, setTrack] = useState<Assignment["track"]>([]);

  useEffect(() => {
    api
      .trackStages()
      .then((data) => setTrack(data.stages))
      .catch(() => {});
  }, []);

  return (
    <div className="container" style={{ padding: "1rem 0 3rem" }}>
      {status === "authenticated" && user ? (
        <AppHeader user={user} onLogout={clearAuth} />
      ) : (
        <PublicHeader />
      )}

      <h1 style={{ margin: "0 0 0.5rem" }}>Track 1 — Web Systems</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1rem", maxWidth: "42rem" }}>
        One app, every layer — Git, UI, API, SQL, ORM, auth, tests, deploy.
        Twelve stages in one evolving repo. Each stage: lesson → sandbox → quiz
        → project. CommitLoop gives the map; you bring curiosity, research, and
        the commits that prove you did the work.
      </p>

      <div
        className="card"
        style={{
          display: "grid",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          padding: "1rem 1.25rem",
        }}
      >
        {TRACK_ARC.map((phase) => (
          <div
            key={phase.label}
            style={{
              display: "grid",
              gap: "0.15rem",
              gridTemplateColumns: "minmax(6rem, auto) minmax(3rem, auto) 1fr",
              alignItems: "baseline",
            }}
          >
            <strong style={{ fontSize: "0.9rem" }}>{phase.label}</strong>
            <span
              style={{
                color: "var(--muted)",
                fontSize: "0.8rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              {phase.stages}
            </span>
            <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              {phase.topics}
            </span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "1.1rem", margin: "0 0 0.75rem" }}>All stages</h2>

      {track === null ? (
        <TrackStageListSkeleton />
      ) : (
        <TrackStageList stages={track} />
      )}
    </div>
  );
}
