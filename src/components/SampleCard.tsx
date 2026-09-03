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

const GOOD = /resolved|ready|done|approved/i;
const WARN = /in progress|pending|starting/i;
const BAD = /blocked|failed|denied/i;

function badgeClass(status: string): string {
  if (GOOD.test(status)) return "badge badge--good";
  if (WARN.test(status)) return "badge badge--warn";
  if (BAD.test(status)) return "badge badge--bad";
  return "badge badge--neutral";
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
            <div className="sample-card__text">
              <span className="sample-card__primary">{row.primary}</span>
              <span className="sample-card__secondary">{row.secondary}</span>
            </div>
            <span className={badgeClass(row.status)}>{row.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
