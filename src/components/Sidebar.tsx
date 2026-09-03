interface SidebarConversation {
  id: string;
  title: string;
}

interface SidebarProps {
  conversations: SidebarConversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function Sidebar({ conversations, activeId, onSelect, onNewChat }: SidebarProps) {
  return (
    <nav className="sidebar" aria-label="Conversation history">
      <button type="button" className="sidebar__new-chat" onClick={onNewChat}>
        + New chat
      </button>
      <ul className="sidebar__list">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={
                "sidebar__item" + (c.id === activeId ? " sidebar__item--active" : "")
              }
              onClick={() => onSelect(c.id)}
            >
              {c.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
