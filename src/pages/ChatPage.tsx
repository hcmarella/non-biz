import { useState } from "react";
import { ChatMessage } from "../components/ChatMessage";
import { Sidebar } from "../components/Sidebar";
import { sendChatMessage } from "../lib/apiClient";
import type { ChatResponse } from "../schemas/ai_response";

interface ChatEntry {
  id: string;
  question: string;
  response: ChatResponse | null;
  error: string | null;
}

interface Conversation {
  id: string;
  title: string;
  entries: ChatEntry[];
  conversationId: string | null;
}

interface ChatPageProps {
  teamId: string;
  persona: string;
  initialQuestion?: string;
}

function newConversation(): Conversation {
  return { id: crypto.randomUUID(), title: "New chat", entries: [], conversationId: null };
}

export function ChatPage({ teamId, persona, initialQuestion }: ChatPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>(() => [newConversation()]);
  const [activeId, setActiveId] = useState(() => conversations[0].id);
  const [input, setInput] = useState(initialQuestion ?? "");
  const [isSending, setIsSending] = useState(false);

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0];

  function updateActive(update: (c: Conversation) => Conversation) {
    setConversations((prev) => prev.map((c) => (c.id === activeId ? update(c) : c)));
  }

  function handleNewChat() {
    const conversation = newConversation();
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    setInput("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const question = input.trim();
    if (!question || isSending) return;

    const entryId = crypto.randomUUID();
    const isFirstMessage = active.entries.length === 0;
    updateActive((c) => ({
      ...c,
      title: isFirstMessage ? question.slice(0, 48) : c.title,
      entries: [...c.entries, { id: entryId, question, response: null, error: null }],
    }));
    setInput("");
    setIsSending(true);

    try {
      const response = await sendChatMessage({
        question,
        team_id: teamId,
        persona,
        conversation_id: active.conversationId,
      });
      updateActive((c) => ({
        ...c,
        conversationId: response.conversation_id,
        entries: c.entries.map((e) => (e.id === entryId ? { ...e, response } : e)),
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      updateActive((c) => ({
        ...c,
        entries: c.entries.map((e) => (e.id === entryId ? { ...e, error: message } : e)),
      }));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="chat-page">
      <Sidebar
        conversations={conversations.map((c) => ({ id: c.id, title: c.title }))}
        activeId={activeId}
        onSelect={setActiveId}
        onNewChat={handleNewChat}
      />
      <div className="chat-page__main">
        <div className="chat-page__thread">
          {active.entries.length === 0 && (
            <p className="chat-page__empty">Ask anything to get started.</p>
          )}
          {active.entries.map((entry) => (
            <div key={entry.id} className="chat-thread-entry">
              <div className="message-bubble message-bubble--user">{entry.question}</div>
              {entry.response && (
                <div className="message-bubble message-bubble--assistant">
                  <ChatMessage response={entry.response} />
                </div>
              )}
              {entry.error && (
                <div className="message-bubble message-bubble--assistant chat-view__error">
                  {entry.error}
                </div>
              )}
              {!entry.response && !entry.error && (
                <div className="message-bubble message-bubble--assistant">Thinking…</div>
              )}
            </div>
          ))}
        </div>
        <form className="chat-page__composer" onSubmit={handleSubmit}>
          <input
            aria-label="Chat message"
            className="chat-page__input"
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
    </div>
  );
}
