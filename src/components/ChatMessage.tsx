import ReactMarkdown from "react-markdown";
import type { ChatResponse } from "../schemas/ai_response";
import { SourcesPanel } from "./SourcesPanel";
import { TransparencyLine } from "./TransparencyLine";

interface ChatMessageProps {
  response: ChatResponse;
}

export function ChatMessage({ response }: ChatMessageProps) {
  return (
    <div className="chat-message">
      <div className="chat-message__answer">
        <ReactMarkdown>{response.answer}</ReactMarkdown>
      </div>
      <SourcesPanel sources={response.sources} />
      <TransparencyLine gatePassed={response.gate_passed} sources={response.sources} />
    </div>
  );
}
