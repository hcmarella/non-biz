import type { ChatResponse } from "../schemas/ai_response";

export const mockResponse: ChatResponse = {
  answer:
    "The staging environment is refreshed nightly at 02:00 UTC from a prod snapshot.",
  route: "rag_node",
  sources: [
    { source_type: "knowledge_chunk", source_ref: "chunk-42", score: 0.87 },
    {
      source_type: "jira",
      source_ref: "board-1/sprint-9",
      title: "Sprint 9",
      url: "https://jira.example.com/board/1/sprint/9",
    },
  ],
  gate_passed: true,
  score: 0.91,
  conversation_id: "conv-001",
  message_id: "msg-001",
};
