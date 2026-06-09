import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo, LogoMark } from "./logo";

describe("Logo", () => {
  it("renders mark and wordmark with home link", () => {
    render(<Logo href="/home" />);

    expect(screen.getByRole("link", { name: "CommitLoop" })).toHaveAttribute(
      "href",
      "/home",
    );
  });

  it("renders mark-only variant", () => {
    const { container } = render(<LogoMark />);

    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
