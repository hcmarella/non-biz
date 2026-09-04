// Mirrors GET /admin/review-queue and the content_review_queue table
// (forge-api-gateway db/schema.sql). Approve is scoped to target='new_skill'
// (approve-skill writes knowledge/skills/<team>/<id>.md and git-commits it);
// other targets (e.g. chunk_edit) aren't handled by that endpoint yet.
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewItem {
  review_id: string;
  team_id: string;
  target: string;
  proposed_content: string;
  status: ReviewStatus;
  submitted_by: string;
}
