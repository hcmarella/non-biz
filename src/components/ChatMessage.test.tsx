import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockResponse } from "../mocks/mockResponse";
import { ChatMessage } from "./ChatMessage";

describe("ChatMessage", () => {
  it("renders the answer, sources, and transparency line from the response object", () => {
    render(<ChatMessage response={mockResponse} />);

    expect(screen.getByText(mockResponse.answer)).toBeInTheDocument();

    for (const source of mockResponse.sources) {
      const label = source.title ?? source.source_ref ?? source.source_type;
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }

    expect(screen.getByText(/Grounded · Sources:/)).toBeInTheDocument();
  });

  it("shows Unverified and omits the sources panel when gate_passed is false and there are no sources", () => {
    render(
      <ChatMessage response={{ ...mockResponse, gate_passed: false, sources: [] }} />,
    );

    expect(screen.queryByText("Sources")).not.toBeInTheDocument();
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });
});
