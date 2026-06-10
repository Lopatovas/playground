import type { Assignment } from "@/lib/api";

const STEPS = ["lesson", "sandbox", "quiz", "project"] as const;

const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  lesson: "Lesson",
  sandbox: "Sandbox",
  quiz: "Quiz",
  project: "Project",
};

export function AssignmentStepTabs({
  activeStep,
  busy,
  canAccessProject,
  onSelect,
}: {
  activeStep: Assignment["step"];
  busy: boolean;
  canAccessProject: boolean;
  onSelect: (step: Assignment["step"]) => void;
}) {
  return (
    <div className="tabs" role="tablist" aria-label="Assignment steps">
      {STEPS.map((step) => {
        const locked = step === "project" && !canAccessProject;

        return (
          <button
            key={step}
            type="button"
            role="tab"
            aria-selected={activeStep === step}
            aria-disabled={locked}
            className={`tab ${activeStep === step ? "active" : ""}`}
            disabled={busy || locked}
            title={locked ? "Pass the quiz to unlock project" : undefined}
            onClick={() => onSelect(step)}
          >
            {STEP_LABELS[step]}
          </button>
        );
      })}
    </div>
  );
}
