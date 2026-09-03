import { ReviewQueuePage } from "./ReviewQueuePage";

interface AdminSectionProps {
  teamId: string;
  reviewer: string;
}

// Entry point for the code-split Admin bundle (React.lazy(() => import("./admin"))).
export default function AdminSection({ teamId, reviewer }: AdminSectionProps) {
  return (
    <section className="admin-section">
      <h2>Review Queue</h2>
      <ReviewQueuePage teamId={teamId} reviewer={reviewer} />
    </section>
  );
}
