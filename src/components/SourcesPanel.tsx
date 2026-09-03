import type { ChatResponse } from "../schemas/ai_response";

interface SourcesPanelProps {
  sources: ChatResponse["sources"];
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="sources-panel">
      <h4 className="sources-panel__heading">Sources</h4>
      <ul className="sources-panel__list">
        {sources.map((source, index) => (
          <li key={`${source.source_ref ?? source.source_type}-${index}`} className="sources-panel__item">
            <span className="sources-panel__type">{source.source_type}</span>
            <span className="sources-panel__title">
              {source.title ?? source.source_ref ?? source.source_type}
            </span>
            {source.url && (
              <a
                className="sources-panel__link"
                href={source.url}
                target="_blank"
                rel="noreferrer"
              >
                open
              </a>
            )}
            {source.score !== undefined && (
              <span className="sources-panel__score">score {source.score.toFixed(2)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
