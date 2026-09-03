import { useState } from "react";
import { sendChatMessage } from "../lib/apiClient";
import type { ChatResponse } from "../schemas/ai_response";
import { ChatMessage } from "./ChatMessage";

interface ChatEntry {
  id: string;
  question: string;
  response: ChatResponse | null;
  error: string | null;
}

interface ChatViewProps {
  teamId: string;
  persona: string;
}

export function ChatView({ teamId, persona }: ChatViewProps) {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const id = crypto.randomUUID();
    setEntries((prev) => [...prev, { id, question, response: null, error: null }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendChatMessage({
        question,
        team_id: teamId,
        persona,
        conversation_id: conversationId,
      });
      setConversationId(response.conversation_id);
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, response } : entry)),
      );
    } catch (err) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, error: err instanceof Error ? err.message : "Request failed" }
            : entry,
        ),
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-view">
      <div className="chat-view__history">
        {entries.map((entry) => (
          <div key={entry.id} className="chat-view__entry">
            <p className="chat-view__question">{entry.question}</p>
            {entry.response && <ChatMessage response={entry.response} />}
            {entry.error && <p className="chat-view__error">{entry.error}</p>}
            {!entry.response && !entry.error && (
              <p className="chat-view__pending">Thinking…</p>
            )}
          </div>
        ))}
      </div>
      <form className="chat-view__form" onSubmit={handleSubmit}>
        <input
          aria-label="Chat message"
          className="chat-view__input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question…"
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
