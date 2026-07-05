import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PublicHeader } from "@/components/public-header";
import { HomePageSkeleton } from "./dashboard/home-page-skeleton";
import { LandingCompare } from "./landing/landing-compare";
import { LandingFaq } from "./landing/landing-faq";
import { LandingHowItWorks } from "./landing/landing-how-it-works";
import { LandingOutcomes } from "./landing/landing-outcomes";
import { LandingPreview } from "./landing/landing-preview";
import { LandingProblem } from "./landing/landing-problem";
import { LandingTrustBar } from "./landing/landing-trust-bar";
import { AssignmentChecklist } from "./assignment/assignment-checklist";
import { AssignmentContentCard } from "./assignment/assignment-content-card";
import { AssignmentStepTabs } from "./assignment/assignment-step-tabs";
import { AssignmentSummaryCard } from "./assignment/assignment-summary-card";
import { TrackStageList } from "./curriculum/track-stage-list";
import { CommitmentSetupCard } from "./dashboard/commitment-setup-card";
import { LandingFeatureGrid } from "./landing/landing-feature-grid";
import { RepoLink } from "./repo/repo-link";
import { RepoSettingsForm } from "./settings/repo-settings-form";
import { SettingsDetails } from "./settings/settings-details";
import type { Assignment } from "@/lib/api";
import type { FormEvent } from "react";

const assignment: Assignment = {
  stage: {
    slug: "stage-0-onboarding",
    title: "Stage 0 — Onboarding",
    goal: "Set up your project",
  },
  step: "lesson",
  stepLabel: "Lesson",
  summary: "Create your repo and make the first commit.",
  checklist: [],
  allChecklistDone: false,
  quiz: { passScore: 0.8, questions: [] },
  quizPassed: false,
  canAccessProject: false,
  nextHint: "Up next",
  content: {
    lesson: { pages: [{ id: "intro", title: "Intro", body: "Lesson" }] },
    sandbox: { steps: [{ id: "step-1", title: "Step 1", body: "Sandbox" }] },
    project: "Project",
  },
  track: [],
};

describe("extracted page components", () => {
  it("renders public header and dashboard skeleton", () => {
    render(
      <>
        <PublicHeader />
        <HomePageSkeleton />
      </>,
    );

    expect(screen.getByRole("link", { name: "CommitLoop" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByLabelText("Loading dashboard"),
    ).toBeInTheDocument();
  });

  it("renders landing sections", () => {
    render(
      <>
        <LandingTrustBar />
        <LandingPreview />
        <LandingProblem />
        <LandingHowItWorks />
        <LandingOutcomes />
        <LandingCompare />
        <LandingFaq />
      </>,
    );

    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Today's assignment")).toBeInTheDocument();
    expect(screen.getByText("You don't need another course.")).toBeInTheDocument();
    expect(screen.getByText("Three moves. One loop.")).toBeInTheDocument();
    expect(screen.getByText("Know exactly what to do today")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Built for execution, not consumption.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Is this a bootcamp or video course?")).toBeInTheDocument();
  });

  it("renders dashboard cards", () => {
    render(
      <>
        <AssignmentSummaryCard assignment={assignment} />
        <CommitmentSetupCard />
        <LandingFeatureGrid />
      </>,
    );

    expect(screen.getByText("Stage 0 — Onboarding")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Continue assignment" }),
    ).toHaveAttribute("href", "/assignment");
    expect(
      screen.getByRole("link", { name: "Connect a repo" }),
    ).toHaveAttribute("href", "/settings");
    expect(screen.getByText("GitHub truth")).toBeInTheDocument();
  });

  it("renders assignment content markdown", () => {
    render(<AssignmentContentCard source={"## Lesson\nRead the docs."} />);

    expect(screen.getByRole("heading", { name: "Lesson" })).toBeInTheDocument();
    expect(screen.getByText("Read the docs.")).toBeInTheDocument();
  });

  it("renders assignment tabs and emits step changes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <AssignmentStepTabs
        activeStep="lesson"
        busy={false}
        canAccessProject
        onSelect={onSelect}
      />,
    );

    expect(screen.getByRole("tab", { name: "Lesson" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: "Project" }));

    expect(onSelect).toHaveBeenCalledWith("project");
  });

  it("renders assignment checklist interactions", async () => {
    const user = userEvent.setup();
    const onAdvance = vi.fn();
    const onToggle = vi.fn();

    render(
      <AssignmentChecklist
        allDone
        busy={false}
        items={[{ id: "stage:0", label: "Make a commit", done: false }]}
        onAdvance={onAdvance}
        onToggle={onToggle}
      />,
    );

    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Advance to next stage" }),
    );

    expect(onToggle).toHaveBeenCalledWith("stage:0", true);
    expect(onAdvance).toHaveBeenCalled();
  });

  it("renders repository links and settings panels", async () => {
    const user = userEvent.setup();
    const onNameChange = vi.fn();
    const onOwnerChange = vi.fn();
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());

    render(
      <>
        <RepoLink repo={{ owner: "acme", name: "app" }} />
        <SettingsDetails
          rows={[
            { label: "GitHub", value: "@dev" },
            {
              label: "Community",
              value: "Discord",
              action: "https://discord.example",
            },
          ]}
        />
        <RepoSettingsForm
          error="Repository not found"
          name="app"
          owner="acme"
          saving={false}
          onNameChange={onNameChange}
          onOwnerChange={onOwnerChange}
          onSubmit={onSubmit}
        />
      </>,
    );

    expect(
      screen.getByRole("link", { name: "Open repo on GitHub →" }),
    ).toHaveAttribute("href", "https://github.com/acme/app");
    expect(screen.getByText("@dev")).toBeInTheDocument();
    expect(screen.getByText("Repository not found")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Owner"), "x");
    await user.type(screen.getByLabelText("Repository"), "x");
    await user.click(screen.getByRole("button", { name: "Save repository" }));

    expect(onOwnerChange).toHaveBeenCalledWith("acmex");
    expect(onNameChange).toHaveBeenCalledWith("appx");
    expect(onSubmit).toHaveBeenCalled();
  });

  it("renders track stage status", () => {
    render(
      <TrackStageList
        stages={[
          {
            slug: "stage-0-onboarding",
            title: "Stage 0 — Onboarding",
            available: true,
            status: "current",
          },
          {
            slug: "stage-2-html-css",
            title: "Stage 2 — HTML & CSS",
            available: false,
            status: "locked",
          },
        ]}
      />,
    );

    expect(screen.getByText("Stage 0 — Onboarding")).toBeInTheDocument();
    expect(screen.getByText("locked")).toBeInTheDocument();
  });
});
