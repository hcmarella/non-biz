import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatPage } from "./ChatPage";

vi.mock("../lib/apiClient", () => ({
  sendChatMessage: vi.fn(async ({ question }: { question: string }) => ({
    answer: `Echo: ${question}`,
    route: "rag_node",
    sources: [],
    gate_passed: true,
    score: 0.9,
    conversation_id: "conv-1",
    message_id: "msg-1",
  })),
}));

describe("ChatPage", () => {
  it("keeps separate conversations in the sidebar with independent histories", async () => {
    render(<ChatPage teamId="test" persona="business" />);

    const input = screen.getByLabelText("Chat message");
    fireEvent.change(input, { target: { value: "first question" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByText("Echo: first question")).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /first question/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "+ New chat" }));
    expect(screen.getByText("Ask anything to get started.")).toBeInTheDocument();
    expect(screen.queryByText("Echo: first question")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Chat message"), {
      target: { value: "second question" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(screen.getByText("Echo: second question")).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole("button", { name: /first question/ }));
    expect(screen.getByText("Echo: first question")).toBeInTheDocument();
    expect(screen.queryByText("Echo: second question")).not.toBeInTheDocument();
  });
});
