"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import type { SandboxCheckResult, SandboxStep } from "@/lib/api";

type StepResult = SandboxCheckResult & { answer: string };

export function AssignmentSandbox({
  intro,
  steps,
  onCheck,
}: {
  intro?: string;
  steps: SandboxStep[];
  onCheck: (stepId: string, answer: string) => Promise<SandboxCheckResult>;
}) {
  const [active, setActive] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, StepResult>>({});
  const [checking, setChecking] = useState<string | null>(null);

  if (steps.length === 0) {
    return (
      <div className="card">
        {intro ? <Markdown source={intro} /> : null}
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Sandbox steps are on their way.
        </p>
      </div>
    );
  }

  const checkpoints = steps.filter((step) => step.checkpoint);
  const passedCount = checkpoints.filter(
    (step) => results[step.id]?.correct,
  ).length;
  const allPassed =
    checkpoints.length > 0 && passedCount === checkpoints.length;

  const safeActive = Math.min(active, steps.length - 1);
  const step = steps[safeActive]!;
  const checkpoint = step.checkpoint;
  const draft = drafts[step.id] ?? "";
  const result = results[step.id];

  async function check() {
    if (!checkpoint) return;
    const answer = draft.trim();
    if (!answer) return;

    setChecking(step.id);
    try {
      const outcome = await onCheck(step.id, answer);
      setResults((current) => ({
        ...current,
        [step.id]: { ...outcome, answer },
      }));
    } finally {
      setChecking(null);
    }
  }

  function setDraft(value: string) {
    setDrafts((current) => ({ ...current, [step.id]: value }));
  }

  return (
    <div className="sandbox">
      {intro ? (
        <div className="card sandbox__intro">
          <Markdown source={intro} />
        </div>
      ) : null}

      <div className="sandbox__progress">
        <span className="label">
          {checkpoints.length > 0
            ? `${passedCount} / ${checkpoints.length} checkpoints passed`
            : "Guided practice"}
        </span>
        <div className="sandbox__dots">
          {steps.map((s, index) => {
            const state = results[s.id]?.correct
              ? "done"
              : index === safeActive
                ? "active"
                : "todo";
            return (
              <button
                key={s.id}
                type="button"
                className={`sandbox__dot sandbox__dot--${state}`}
                aria-label={`Step ${index + 1}: ${s.title}`}
                aria-current={index === safeActive ? "step" : undefined}
                onClick={() => setActive(index)}
              >
                {results[s.id]?.correct ? "✓" : index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card sandbox__step">
        <div className="label">
          Step {safeActive + 1} of {steps.length}
        </div>
        <h3 style={{ margin: "0.35rem 0 0.5rem" }}>{step.title}</h3>
        <Markdown source={step.body} />

        {checkpoint ? (
          <div className="sandbox__check">
            <p className="sandbox__check-prompt">{checkpoint.prompt}</p>

            {checkpoint.kind === "choice" ? (
              <div className="sandbox__choices">
                {checkpoint.choices.map((choice) => (
                  <label key={choice.id} className="sandbox__choice">
                    <input
                      type="radio"
                      name={`sandbox-${step.id}`}
                      value={choice.id}
                      checked={draft === choice.id}
                      disabled={checking === step.id}
                      onChange={() => setDraft(choice.id)}
                    />
                    <span>{choice.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="sandbox__text-input"
                type="text"
                value={draft}
                placeholder={checkpoint.placeholder ?? "Type your answer"}
                disabled={checking === step.id}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void check();
                  }
                }}
              />
            )}

            <button
              type="button"
              className="btn btn-primary sandbox__check-btn"
              disabled={!draft.trim() || checking === step.id}
              onClick={() => void check()}
            >
              {checking === step.id ? "Checking…" : "Check answer"}
            </button>

            {result ? (
              <div
                className={`sandbox__feedback sandbox__feedback--${
                  result.correct ? "ok" : "no"
                }`}
              >
                <strong>
                  {result.correct ? "Correct" : "Not quite — try again"}
                </strong>
                <span>{result.explanation}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="sandbox__controls">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={safeActive === 0}
            onClick={() => setActive((value) => Math.max(0, value - 1))}
          >
            ← Previous
          </button>
          {safeActive < steps.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                setActive((value) => Math.min(steps.length - 1, value + 1))
              }
            >
              Next step →
            </button>
          ) : null}
        </div>
      </div>

      {allPassed ? (
        <div className="card sandbox__complete">
          <strong style={{ color: "var(--git-on-border)" }}>
            All checkpoints passed.
          </strong>{" "}
          You&apos;re ready for the Quiz tab.
        </div>
      ) : null}
    </div>
  );
}
