"use client";

import { useState } from "react";
import { Markdown } from "@/components/markdown";
import type { LessonPage } from "@/lib/api";

export function AssignmentLesson({ pages }: { pages: LessonPage[] }) {
  const [active, setActive] = useState(0);

  if (pages.length === 0) {
    return (
      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Lesson content is on its way.
        </p>
      </div>
    );
  }

  const safeActive = Math.min(active, pages.length - 1);
  const page = pages[safeActive]!;
  const isLast = safeActive === pages.length - 1;

  return (
    <div className="lesson">
      {pages.length > 1 ? (
        <nav className="lesson__nav" aria-label="Lesson pages">
          {pages.map((p, index) => (
            <button
              key={p.id}
              type="button"
              className={`lesson__nav-item ${
                index === safeActive ? "is-active" : ""
              }`}
              aria-current={index === safeActive ? "step" : undefined}
              onClick={() => setActive(index)}
            >
              <span className="lesson__nav-num">{index + 1}</span>
              <span>{p.title}</span>
            </button>
          ))}
        </nav>
      ) : null}

      <div className="card lesson__body">
        <div className="lesson__page-head">
          <span className="label">
            Page {safeActive + 1} of {pages.length}
          </span>
          <h2 style={{ margin: "0.35rem 0 0" }}>{page.title}</h2>
        </div>

        <Markdown source={page.body} />

        <div className="lesson__controls">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={safeActive === 0}
            onClick={() => setActive((value) => Math.max(0, value - 1))}
          >
            ← Previous
          </button>
          {isLast ? (
            <span className="lesson__done-hint">
              Lesson complete — head to the Sandbox tab to practice.
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                setActive((value) => Math.min(pages.length - 1, value + 1))
              }
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
