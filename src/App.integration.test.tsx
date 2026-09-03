// Exercises Step 14 (chat -> BFF -> gateway) and Step 15 (admin approval flow)
// against real instances of bff/server.mjs and mock-gateway/server.mjs over
// actual HTTP (not mocked fetch). Both are spawned for this test only, so
// `npm test` stays self-contained, deterministic, and never touches the real
// forge-api-gateway's Postgres/git state.
import { spawn, type ChildProcess } from "node:child_process";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import App from "./App";

function spawnAndWait(command: string, args: string[]): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });
    const timeout = setTimeout(
      () => reject(new Error(`${args.join(" ")} did not start`)),
      5000,
    );
    child.stdout?.on("data", (chunk: Buffer) => {
      if (chunk.toString().includes("listening")) {
        clearTimeout(timeout);
        resolve(child);
      }
    });
    child.on("error", reject);
  });
}

let gateway: ChildProcess;
let bff: ChildProcess;

beforeAll(async () => {
  gateway = await spawnAndWait("node", ["mock-gateway/server.mjs"]);
  bff = await spawnAndWait("node", ["bff/server.mjs"]);
});

afterAll(() => {
  gateway.kill();
  bff.kill();
});

describe("App end-to-end against bff -> mock-gateway", () => {
  it("approves a review-queue draft from the UI and sees it reflected on the next chat ask", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Persona:/), {
      target: { value: "admin" },
    });

    // Admin section is code-split (React.lazy) and gated on persona === "admin".
    const textarea = await screen.findByRole<HTMLTextAreaElement>(
      "textbox",
      { name: "Draft content" },
      { timeout: 5000 },
    );
    expect(textarea.value).toContain("refreshed nightly at 02:00 UTC");

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(screen.queryByText(/new_skill/)).not.toBeInTheDocument(),
    );

    const chatInput = screen.getByLabelText("Chat message");
    fireEvent.change(chatInput, { target: { value: "when does staging refresh" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(
        document.querySelector(".chat-message__answer"),
      ).toHaveTextContent(/refreshed nightly at 02:00 UTC/),
    );

    expect(document.querySelector(".transparency-line")).toHaveTextContent(
      /Grounded · Sources:/,
    );
  });
});
