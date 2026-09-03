import type { ChatResponse } from "../schemas/ai_response";

interface TransparencyLineProps {
  gatePassed: ChatResponse["gate_passed"];
  sources: ChatResponse["sources"];
}

export function TransparencyLine({ gatePassed, sources }: TransparencyLineProps) {
  const label = gatePassed ? "Grounded" : "Unverified";
  const sourceNames = sources
    .map((source) => source.title ?? source.source_ref ?? source.source_type)
    .join(", ");

  return (
    <p className="transparency-line">
      {label}
      {sourceNames && ` · Sources: ${sourceNames}`}
    </p>
  );
}
