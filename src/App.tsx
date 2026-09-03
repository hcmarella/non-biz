import { lazy, Suspense, useState } from "react";
import { ChatView } from "./components/ChatView";
import "./App.css";

const AdminSection = lazy(() => import("./admin"));

const TEAM_ID = "test";
// Client-selected for now — forge-api-gateway has no identity/role
// resolution yet (no /me, no Okta wiring); persona is just a string the
// caller sends. "admin" is a UI-only convention gating the Admin section,
// not a value the backend treats specially.
const PERSONAS = ["business", "developer", "test", "admin"];

function App() {
  const [persona, setPersona] = useState(PERSONAS[0]);
  const isAdmin = persona === "admin";

  return (
    <main className="chat">
      <h1>ForgeUI</h1>
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
      <ChatView teamId={TEAM_ID} persona={persona} />
      {isAdmin && (
        <Suspense fallback={<p>Loading admin…</p>}>
          <AdminSection teamId={TEAM_ID} reviewer={persona} />
        </Suspense>
      )}
    </main>
  );
}

export default App;
