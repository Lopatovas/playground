"use client";

import { useState } from "react";
import type { Assignment, QuizResult } from "@/lib/api";

export function AssignmentQuiz({
  assignment,
  busy,
  onSubmit,
}: {
  assignment: Assignment;
  busy: boolean;
  onSubmit: (answers: Record<string, string>) => Promise<QuizResult | null>;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next = await onSubmit(answers);
    setResult(next);
  }

  if (assignment.quizPassed) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: "var(--git-on-border)", fontWeight: 600 }}>
          Quiz passed. Project step unlocked.
        </p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <p style={{ marginTop: 0, color: "var(--muted)" }}>
        Answer every question. You need{" "}
        {Math.round(assignment.quiz.passScore * 100)}% or higher to unlock the
        project step.
      </p>

      <div style={{ display: "grid", gap: "1.25rem" }}>
        {assignment.quiz.questions.map((question) => (
          <fieldset
            key={question.id}
            style={{
              margin: 0,
              padding: 0,
              border: "none",
            }}
          >
            <legend style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
              {question.prompt}
            </legend>
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {question.choices.map((choice) => {
                const resultItem = result?.results.find(
                  (item) => item.questionId === question.id,
                );
                const checked = answers[question.id] === choice.id;

                return (
                  <label
                    key={choice.id}
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "flex-start",
                      color:
                        resultItem && !resultItem.correct && checked
                          ? "var(--danger)"
                          : "inherit",
                    }}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={choice.id}
                      checked={checked}
                      disabled={busy}
                      onChange={() =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: choice.id,
                        }))
                      }
                    />
                    <span>{choice.text}</span>
                  </label>
                );
              })}
            </div>
            {result?.results.find((item) => item.questionId === question.id)
              ?.correct === false ? (
              <p
                style={{
                  margin: "0.5rem 0 0",
                  color: "var(--muted)",
                  fontSize: "0.9rem",
                }}
              >
                {
                  result.results.find((item) => item.questionId === question.id)
                    ?.explanation
                }
              </p>
            ) : null}
          </fieldset>
        ))}
      </div>

      {result ? (
        <p
          style={{
            margin: "1rem 0 0",
            color: result.passed ? "var(--git-on-border)" : "var(--danger)",
            fontWeight: 600,
          }}
        >
          Score: {Math.round(result.score * 100)}%
          {result.passed ? " — passed" : " — try again"}
        </p>
      ) : null}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={busy || assignment.quiz.questions.some((q) => !answers[q.id])}
        style={{ marginTop: "1rem" }}
      >
        {busy ? "Checking…" : "Submit quiz"}
      </button>
    </form>
  );
}
