import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./app-header";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/home",
}));

vi.mock("@/lib/api", () => ({
  api: {
    logout: vi.fn().mockResolvedValue({ ok: true }),
  },
}));

import { api } from "@/lib/api";

describe("AppHeader", () => {
  it("renders navigation and logs out", async () => {
    const user = userEvent.setup();
    render(
      <AppHeader
        user={{
          id: "1",
          username: "dev",
          avatarUrl: null,
          repo: null,
          trackId: "track-1",
          currentStage: "stage-0-onboarding",
          currentStep: "lesson",
          isMentor: false,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "CommitLoop" })).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
    expect(screen.getByText("@dev")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(api.logout).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("shows mentor navigation for mentors", () => {
    render(
      <AppHeader
        user={{
          id: "1",
          username: "mentor",
          avatarUrl: null,
          repo: null,
          trackId: "track-1",
          currentStage: "stage-0-onboarding",
          currentStep: "lesson",
          isMentor: true,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Mentor" })).toHaveAttribute(
      "href",
      "/mentor",
    );
  });
});
