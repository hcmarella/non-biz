import type { ChatResponse } from "../schemas/ai_response";
import { SourcesPanel } from "./SourcesPanel";
import { TransparencyLine } from "./TransparencyLine";

interface ChatMessageProps {
  response: ChatResponse;
}

export function ChatMessage({ response }: ChatMessageProps) {
  return (
    <div className="chat-message">
      <p className="chat-message__answer">{response.answer}</p>
      <SourcesPanel sources={response.sources} />
      <TransparencyLine gatePassed={response.gate_passed} sources={response.sources} />
    </div>
  );
}
