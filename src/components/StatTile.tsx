interface StatTileProps {
  label: string;
  value: string;
  trend?: string;
}

export function StatTile({ label, value, trend }: StatTileProps) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__label">{label}</span>
      <span className="stat-tile__value">{value}</span>
      {trend && <span className="stat-tile__trend">{trend}</span>}
    </div>
  );
}
