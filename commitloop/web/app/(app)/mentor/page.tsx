"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MentorStudentTable } from "@/features/mentor/mentor-student-table";
import { PageLoader } from "@/components/page-loader";
import { api, type MentorStudent } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function MentorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [students, setStudents] = useState<MentorStudent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.isMentor) {
      return;
    }

    let cancelled = false;

    api
      .mentorStudents()
      .then((response) => {
        if (!cancelled) setStudents(response.students);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          if (err.message.includes("Mentor access")) {
            router.push("/home");
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [router, user?.isMentor]);

  if (!user?.isMentor) {
    return (
      <div className="card">
        <p style={{ marginTop: 0 }}>Mentor access is required for this page.</p>
        <Link href="/home">← Back to home</Link>
      </div>
    );
  }

  if (!students && !error) {
    return <PageLoader variant="page" label="Loading mentor dashboard" />;
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

      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Mentor</h1>
      <p style={{ margin: "0 0 1.25rem", color: "var(--muted)" }}>
        Students sorted by who needs attention first.
      </p>

      {error ? (
        <div className="card">
          <p style={{ margin: 0, color: "var(--danger)" }}>{error}</p>
        </div>
      ) : (
        <MentorStudentTable students={students ?? []} />
      )}
    </>
  );
}
