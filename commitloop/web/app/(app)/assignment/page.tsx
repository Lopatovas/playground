"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AssignmentChecklist } from "@/features/assignment/assignment-checklist";
import { AssignmentPageSkeleton } from "@/features/assignment/assignment-page-skeleton";
import { AssignmentContentCard } from "@/features/assignment/assignment-content-card";
import { AssignmentLesson } from "@/features/assignment/assignment-lesson";
import { AssignmentQuiz } from "@/features/assignment/assignment-quiz";
import { AssignmentSandbox } from "@/features/assignment/assignment-sandbox";
import { AssignmentStepTabs } from "@/features/assignment/assignment-step-tabs";
import { RepoLink } from "@/features/repo/repo-link";
import { api, type Assignment } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AssignmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .assignment()
      .then((nextAssignment) => {
        if (!cancelled) setAssignment(nextAssignment);
      })
      .catch(() => router.push("/"));

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function selectStep(step: Assignment["step"]) {
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

  async function submitQuiz(answers: Record<string, string>) {
    setBusy(true);
    try {
      const response = await api.submitQuiz(answers);
      setAssignment(response);
      return response.quizResult ?? null;
    } finally {
      setBusy(false);
    }
  }

  if (!assignment) {
    return <AssignmentPageSkeleton />;
  }

  return (
    <>
      <p style={{ marginBottom: "1rem" }}>
        <Link
          href="/home"
          style={{ color: "var(--muted)", fontSize: "0.9rem" }}
        >
          ← Home
        </Link>
      </p>

      <h1 style={{ margin: "0 0 1rem", fontSize: "1.5rem" }}>
        {assignment.stage.title}
      </h1>

      <AssignmentStepTabs
        activeStep={assignment.step}
        busy={busy}
        canAccessProject={assignment.canAccessProject}
        onSelect={selectStep}
      />

      {assignment.step === "lesson" ? (
        <AssignmentLesson pages={assignment.content.lesson.pages} />
      ) : null}

      {assignment.step === "sandbox" ? (
        <AssignmentSandbox
          intro={assignment.content.sandbox.intro}
          steps={assignment.content.sandbox.steps}
          onCheck={api.checkSandbox}
        />
      ) : null}

      {assignment.step === "quiz" ? (
        <AssignmentQuiz
          assignment={assignment}
          busy={busy}
          onSubmit={submitQuiz}
        />
      ) : null}

      {assignment.step === "project" ? (
        <AssignmentContentCard source={assignment.content.project} />
      ) : null}

      {assignment.step === "project" ? (
        <AssignmentChecklist
          allDone={assignment.allChecklistDone}
          busy={busy}
          items={assignment.checklist}
          onAdvance={advance}
          onToggle={toggle}
        />
      ) : null}

      {user?.repo ? <RepoLink repo={user.repo} /> : null}
    </>
  );
}
