import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingState } from "./loading-state";
import { PageLoader } from "./page-loader";
import { Skeleton } from "./skeleton";

describe("PageLoader", () => {
  it("renders branded loader with accessible status", () => {
    render(<PageLoader label="Signing in" />);

    expect(screen.getByRole("status", { name: "Signing in" })).toBeInTheDocument();
    expect(screen.getByText("CommitLoop")).toBeInTheDocument();
    expect(screen.getByText("Signing in")).toBeInTheDocument();
  });
});

describe("LoadingState", () => {
  it("delegates to PageLoader", () => {
    render(<LoadingState label="Loading dashboard" />);
    expect(
      screen.getByRole("status", { name: "Loading dashboard" }),
    ).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("renders shimmer placeholder", () => {
    const { container } = render(<Skeleton width={120} height={16} />);
    expect(container.querySelector(".skeleton")).toBeInTheDocument();
  });
});
