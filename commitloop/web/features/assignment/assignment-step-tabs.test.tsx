import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssignmentStepTabs } from "./assignment-step-tabs";

describe("AssignmentStepTabs", () => {
  it("renders all four steps", () => {
    render(
      <AssignmentStepTabs
        activeStep="lesson"
        busy={false}
        canAccessProject={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole("tab", { name: "Lesson" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Sandbox" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Quiz" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Project" })).toBeInTheDocument();
  });

  it("locks the project tab until quiz is passed", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <AssignmentStepTabs
        activeStep="quiz"
        busy={false}
        canAccessProject={false}
        onSelect={onSelect}
      />,
    );

    const projectTab = screen.getByRole("tab", { name: "Project" });
    expect(projectTab).toBeDisabled();
    expect(projectTab).toHaveAttribute("title", "Pass the quiz to unlock project");

    await user.click(projectTab);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("allows selecting project when quiz is passed", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <AssignmentStepTabs
        activeStep="quiz"
        busy={false}
        canAccessProject
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Project" }));
    expect(onSelect).toHaveBeenCalledWith("project");
  });
});
