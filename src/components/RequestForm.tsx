import { useState } from "react";
import { sendChatMessage } from "../lib/apiClient";
import type { ChatResponse } from "../schemas/ai_response";

interface RequestFormProps {
  teamId: string;
  persona: string;
}

const PRIORITIES = ["Low", "Medium", "High"];

// Composes the form into a question shaped to match the "create ticket"
// skill trigger in forge-api-gateway's app/agents/graph.py (_SKILL_PATTERNS:
// "create (a|an|the)? ?(follow-?up )?(jira )?ticket"), so submitting this
// form actually goes through the real skill-match flow — not a direct Jira
// API call, since no Jira credential is wired up yet.
export function RequestForm({ teamId, persona }: RequestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(PRIORITIES[1]);
  const [team, setTeam] = useState(teamId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const question = `Create a ticket: ${title.trim()} — ${description.trim()} (priority: ${priority}, team: ${team.trim()})`;

    try {
      const response = await sendChatMessage({
        question,
        team_id: team.trim() || teamId,
        persona,
      });
      setResult(response);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <h3 className="request-form__title">New internal request</h3>
      <label className="request-form__field">
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label className="request-form__field">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <div className="request-form__row">
        <label className="request-form__field">
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="request-form__field">
          Team
          <input value={team} onChange={(e) => setTeam(e.target.value)} />
        </label>
      </div>
      <button type="submit" disabled={isSubmitting || !title.trim()}>
        {isSubmitting ? "Submitting…" : "Submit request"}
      </button>
      {result && (
        <p className="request-form__result">{result.answer}</p>
      )}
      {error && <p className="chat-view__error">{error}</p>}
    </form>
  );
}
