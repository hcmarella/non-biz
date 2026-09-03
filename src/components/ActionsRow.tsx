// Not currently populated: forge-api-gateway's ChatResponse has no `actions`
// field yet. Kept as a standalone renderer, decoupled from ChatResponse, so
// it's ready to wire up if/when the backend adds action affordances.
export interface ChatAction {
  id: string;
  label: string;
}

interface ActionsRowProps {
  actions: ChatAction[];
  onAction?: (action: ChatAction) => void;
}

export function ActionsRow({ actions, onAction }: ActionsRowProps) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="actions-row">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className="actions-row__button"
          onClick={() => onAction?.(action)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
