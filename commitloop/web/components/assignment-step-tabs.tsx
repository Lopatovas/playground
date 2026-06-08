import type { Assignment } from "@/lib/api";

const STEPS = ["lesson", "sandbox", "project"] as const;

const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  lesson: "Lesson",
  sandbox: "Sandbox",
  project: "Project",
};

export function AssignmentStepTabs({
  activeStep,
  busy,
  onSelect,
}: {
  activeStep: Assignment["step"];
  busy: boolean;
  onSelect: (step: Assignment["step"]) => void;
}) {
  return (
    <div className="tabs" role="tablist" aria-label="Assignment steps">
      {STEPS.map((step) => (
        <button
          key={step}
          type="button"
          role="tab"
          aria-selected={activeStep === step}
          className={`tab ${activeStep === step ? "active" : ""}`}
          disabled={busy}
          onClick={() => onSelect(step)}
        >
          {STEP_LABELS[step]}
        </button>
      ))}
    </div>
  );
}
