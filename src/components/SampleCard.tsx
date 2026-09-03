export interface SampleCardRow {
  primary: string;
  secondary: string;
  status: string;
}

interface SampleCardProps {
  icon: string;
  title: string;
  rows: SampleCardRow[];
}

// Hardcoded sample data — ServiceNow has no connector at all yet and Reports
// has no generation service (see forge-api-gateway's docs/BUILD_SUMMARY.md);
// Jira/Confluence connectors exist but mock the actual HTTP call. This card
// is a visual placeholder for all four, not wired to any backend.
export function SampleCard({ icon, title, rows }: SampleCardProps) {
  return (
    <div className="sample-card">
      <h3 className="sample-card__title">
        <span aria-hidden="true">{icon}</span> {title}
      </h3>
      <ul className="sample-card__list">
        {rows.map((row) => (
          <li key={row.primary} className="sample-card__row">
            <span className="sample-card__primary">{row.primary}</span>
            <span className="sample-card__secondary">{row.secondary}</span>
            <span className="sample-card__status">{row.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
