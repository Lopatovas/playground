"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { api, type Assignment, type User } from "@/lib/api";

export default function CurriculumPage() {
  const [user, setUser] = useState<User | null>(null);
  const [track, setTrack] = useState<Assignment["track"]>([]);

  useEffect(() => {
    api
      .trackStages()
      .then((data) => setTrack(data.stages))
      .catch(() => {});

    api
      .me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="container" style={{ padding: "1rem 0 3rem" }}>
      {user ? <AppHeader user={user} /> : (
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
