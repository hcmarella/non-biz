interface ThinkingIndicatorProps {
  label: string;
}

export function ThinkingIndicator({ label }: ThinkingIndicatorProps) {
  return (
    <div className="thinking-indicator" role="status">
      <span className="thinking-indicator__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      {label}
    </div>
  );
}
