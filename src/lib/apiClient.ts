import type { ChatRequest, ChatResponse } from "../schemas/ai_response";
import type { ReviewItem } from "../types/review";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function sendChatMessage(body: ChatRequest): Promise<ChatResponse> {
  return request<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchReviewQueue(teamId: string): Promise<ReviewItem[]> {
  return request<ReviewItem[]>(
    `/admin/review-queue?team_id=${encodeURIComponent(teamId)}`,
  );
}

export function approveReviewItem(
  reviewId: string,
  editedContent: string,
  reviewer: string,
): Promise<unknown> {
  return request(`/admin/review-queue/${reviewId}/approve-skill`, {
    method: "POST",
    body: JSON.stringify({ edited_content: editedContent, reviewer }),
  });
}

export function rejectReviewItem(
  reviewId: string,
  reviewer: string,
): Promise<unknown> {
  return request(`/admin/review-queue/${reviewId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reviewer }),
  });
}
