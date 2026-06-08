import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Markdown } from "./markdown";

describe("Markdown", () => {
  it("renders headings and paragraphs", () => {
    render(
      <Markdown
        source={"## Section title\n\nParagraph with **bold** text."}
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Section title",
    );
    expect(screen.getByText(/Paragraph with/)).toContainHTML("<strong>bold</strong>");
  });

  it("renders bullet lists", () => {
    render(<Markdown source={"- first item\n- second item"} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("first item");
  });

  it("renders fenced code blocks", () => {
    render(<Markdown source={"```\nconst x = 1;\n```"} />);

    expect(screen.getByText("const x = 1;")).toBeInTheDocument();
    expect(screen.getByText("const x = 1;").closest("pre")).not.toBeNull();
  });

  it("renders inline code", () => {
    render(<Markdown source={"Use `git status` today."} />);
    expect(screen.getByText("git status").tagName).toBe("CODE");
  });
});
