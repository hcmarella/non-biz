import { useEffect, useState } from "react";
import {
  approveReviewItem,
  fetchReviewQueue,
  rejectReviewItem,
} from "../lib/apiClient";
import type { ReviewItem } from "../types/review";

interface ReviewQueuePageProps {
  teamId: string;
  reviewer: string;
  // Checked server-side against ADMIN_ROLES (app/admin/review_queue.py) —
  // not real authorization yet (the caller can claim any role), just a
  // stopgap that stops an accidental wrong-role call. See that file's
  // comment on _require_admin_role for the caveat.
  role: string;
}

export function ReviewQueuePage({ teamId, reviewer, role }: ReviewQueuePageProps) {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setIsLoading(true);
    fetchReviewQueue(teamId)
      .then((result) => {
        setItems(result);
        setDrafts(
          Object.fromEntries(result.map((item) => [item.review_id, item.proposed_content])),
        );
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [teamId]);

  async function handleApprove(reviewId: string) {
    await approveReviewItem(reviewId, drafts[reviewId] ?? "", reviewer, role);
    load();
  }

  async function handleReject(reviewId: string) {
    await rejectReviewItem(reviewId, reviewer, role);
    load();
  }

  if (isLoading) return <p>Loading review queue…</p>;
  if (error) return <p className="chat-view__error">{error}</p>;
  if (items.length === 0) return <p>No pending items.</p>;

  return (
    <div className="review-queue">
      {items.map((item) => (
        <div key={item.review_id} className="review-queue__item">
          <p className="review-queue__meta">
            {item.target} · team {item.team_id}
          </p>
          <textarea
            aria-label="Draft content"
            className="review-queue__textarea"
            value={drafts[item.review_id] ?? ""}
            onChange={(event) =>
              setDrafts((prev) => ({ ...prev, [item.review_id]: event.target.value }))
            }
          />
          <div className="review-queue__actions">
            <button type="button" onClick={() => handleApprove(item.review_id)}>
              Approve
            </button>
            <button type="button" onClick={() => handleReject(item.review_id)}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
