"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
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
        <header className="app-header">
          <Link href="/" className="logo">
            CommitLoop
          </Link>
        </header>
      )}

      <h1 style={{ margin: "0 0 0.5rem" }}>Track 1 — Fundamentals</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Stages 0–1 available. More stages ship as we build.
      </p>

      <div className="card">
        {track.map((stage) => (
          <div key={stage.slug} className="stage-row">
            <span>{stage.status === "locked" ? "○" : "●"}</span>
            <span
              style={{
                color: stage.status === "locked" ? "var(--muted)" : "inherit",
                fontWeight: stage.status === "current" ? 600 : 400,
              }}
            >
              {stage.title}
            </span>
            <span
              className={`pill pill-${stage.status}`}
            >
              {stage.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
