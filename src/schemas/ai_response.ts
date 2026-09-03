// Mirrors ChatRequest/ChatResponse from forge-api-gateway's app/api/chat.py.
// That repo has no separate app/schemas/ai_response.py yet — this is the
// actual inline Pydantic contract, confirmed against the running service
// at the time of writing. Update this file if that contract changes.

export interface ChatRequest {
  question: string;
  team_id?: string;
  persona?: string;
  user_email?: string;
  conversation_id?: string | null;
}

// source_type-dependent: jira/sharepoint carry title+url, knowledge_chunk
// carries score, skill carries neither — only source_type is guaranteed.
export interface ChatSource {
  source_type: string;
  source_ref?: string;
  title?: string;
  url?: string;
  score?: number;
}

export interface ChatResponse {
  answer: string;
  route: string;
  sources: ChatSource[];
  gate_passed: boolean;
  score: number;
  conversation_id: string;
  message_id: string;
}
