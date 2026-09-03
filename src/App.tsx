import { lazy, Suspense, useState } from "react";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import "./App.css";

const AdminSection = lazy(() => import("./admin"));

const TEAM_ID = "test";
// Client-selected for now — forge-api-gateway has no Okta/AD identity
// resolution yet (no /me). Approve/reject now checks a `role` field against
// ADMIN_ROLES server-side (app/admin/review_queue.py), but it's still
// trusted straight from the request body, not verified — a stopgap, not
// real authorization. "admin" here doubles as both the UI-gating persona
// and the role value sent to that check.
const PERSONAS = ["business", "developer", "test", "admin"];

type View = "home" | "chat" | "admin";

function App() {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [view, setView] = useState<View>("home");
  const isAdmin = persona === "admin";

  return (
    <div className="portal">
      <header className="portal__topbar">
        <h1 className="portal__brand">ForgeUI</h1>
        <nav className="portal__nav">
          <button
            type="button"
            className={view === "home" ? "portal__nav-item portal__nav-item--active" : "portal__nav-item"}
            onClick={() => setView("home")}
          >
            Home
          </button>
          <button
            type="button"
            className={view === "chat" ? "portal__nav-item portal__nav-item--active" : "portal__nav-item"}
            onClick={() => setView("chat")}
          >
            Chat
          </button>
          {isAdmin && (
            <button
              type="button"
              className={view === "admin" ? "portal__nav-item portal__nav-item--active" : "portal__nav-item"}
              onClick={() => setView("admin")}
            >
              Admin
            </button>
          )}
        </nav>
        <label className="persona-select">
          Persona:{" "}
          <select value={persona} onChange={(event) => setPersona(event.target.value)}>
            {PERSONAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="portal__body">
        {view === "home" && <HomePage teamId={TEAM_ID} persona={persona} />}
        {view === "chat" && <ChatPage teamId={TEAM_ID} persona={persona} />}
        {view === "admin" && isAdmin && (
          <Suspense fallback={<p>Loading admin…</p>}>
            <AdminSection teamId={TEAM_ID} reviewer={persona} role={persona} />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default App;
