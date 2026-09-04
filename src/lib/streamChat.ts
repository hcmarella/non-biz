import type { ChatRequest, ChatResponse } from "../schemas/ai_response";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StreamEvent {
  stage: string;
  label?: string;
  result?: ChatResponse;
}

// Consumes forge-api-gateway's POST /ai/chat/stream (SSE): a `data: {...}\n\n`
// event per LangGraph node as it completes, then one final event with
// stage: "complete" carrying the same ChatResponse shape as POST /ai/chat.
export async function streamChat(
  body: ChatRequest,
  onProgress: (stage: string, label: string) => void,
): Promise<ChatResponse> {
  const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    throw new Error(`POST /ai/chat/stream failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const raw of events) {
      const line = raw.trim();
      if (!line.startsWith("data: ")) continue;

      const event = JSON.parse(line.slice("data: ".length)) as StreamEvent;
      if (event.stage === "complete" && event.result) {
        return event.result;
      }
      onProgress(event.stage, event.label ?? event.stage);
    }
  }

  throw new Error("stream ended without a complete event");
}
