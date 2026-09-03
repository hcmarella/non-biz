import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders all four sample cards", () => {
    render(<HomePage teamId="test" persona="business" />);

    expect(screen.getByText("Jira")).toBeInTheDocument();
    expect(screen.getByText("Confluence")).toBeInTheDocument();
    expect(screen.getByText("ServiceNow")).toBeInTheDocument();
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("FORGE-142")).toBeInTheDocument();
  });

  it("toggles the request form open and closed", () => {
    render(<HomePage teamId="test" persona="business" />);

    expect(screen.queryByText("New internal request")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ New Request" }));
    expect(screen.getByText("New internal request")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText("New internal request")).not.toBeInTheDocument();
  });
});
