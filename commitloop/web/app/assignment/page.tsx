"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Markdown } from "@/components/markdown";
import { api, type Assignment, type User } from "@/lib/api";

const STEPS = ["lesson", "sandbox", "project"] as const;

export default function AssignmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .me()
      .then(async (u) => {
        setUser(u);
        setAssignment(await api.assignment());
      })
      .catch(() => router.push("/"));
  }, [router]);

  async function selectStep(step: (typeof STEPS)[number]) {
    setBusy(true);
    try {
      setAssignment(await api.setStep(step));
    } finally {
      setBusy(false);
    }
  }

  async function toggle(id: string, done: boolean) {
    setBusy(true);
    try {
      setAssignment(await api.toggleChecklist(id, done));
    } finally {
      setBusy(false);
    }
  }

  async function advance() {
    setBusy(true);
    try {
      setAssignment(await api.advanceStage());
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not advance");
    } finally {
      setBusy(false);
    }
  }

  if (!user || !assignment) {
    return (
      <div className="container" style={{ padding: "3rem 0" }}>
        Loading…
      </div>
    );
  }

  const content =
    assignment.step === "lesson"
      ? assignment.content.lesson
      : assignment.step === "sandbox"
        ? assignment.content.sandbox
        : assignment.content.project;

  return (
    <div className="container" style={{ padding: "1rem 0 3rem" }}>
      <AppHeader user={user} />

      <p style={{ marginBottom: "1rem" }}>
        <Link href="/home" style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          ← Home
        </Link>
      </p>

      <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>
        {assignment.stage.title}
      </h1>

      <div className="tabs">
        {STEPS.map((step) => (
          <button
            key={step}
            type="button"
            className={`tab ${assignment.step === step ? "active" : ""}`}
            disabled={busy}
            onClick={() => selectStep(step)}
          >
            {step === "lesson"
              ? "Lesson"
              : step === "sandbox"
                ? "Sandbox"
                : "Project"}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <Markdown source={content} />
      </div>

      {assignment.step === "project" && assignment.checklist.length > 0 ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Checklist</h3>
          <ul className="checklist">
            {assignment.checklist.map((item) => (
              <li key={item.id}>
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={busy}
                  onChange={(e) => toggle(item.id, e.target.checked)}
                />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
          {assignment.allChecklistDone ? (
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
              disabled={busy}
              onClick={advance}
            >
              Advance to next stage
            </button>
          ) : null}
        </div>
      ) : null}

      {user.repo ? (
        <a
          className="btn btn-ghost"
          href={`https://github.com/${user.repo.owner}/${user.repo.name}`}
          target="_blank"
          rel="noreferrer"
        >
          Open repo on GitHub →
        </a>
      ) : null}
    </div>
  );
}
