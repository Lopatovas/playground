"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PublicHeader } from "@/components/public-header";
import { TrackStageList } from "@/features/curriculum/track-stage-list";
import { TrackStageListSkeleton } from "@/features/curriculum/track-stage-list-skeleton";
import { api, type Assignment } from "@/lib/api";
import { useAuth } from "@/lib/auth";

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
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Twelve stages: Git, HTML/CSS, JavaScript, API, SQL, wire-up, data modeling, ORM, auth, frontend app, then test and deploy — one evolving repo.
      </p>

      {track === null ? (
        <TrackStageListSkeleton />
      ) : (
        <TrackStageList stages={track} />
      )}
    </div>
  );
}
