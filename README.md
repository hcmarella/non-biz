# ForgeUI

Frontend for the Forge Enterprise AI Gateway. Owns the Business/Manager
portal and its BFF; it never talks to Postgres or makes routing decisions —
see `ARCHITECTURE.md` for the full repo boundary and API contract.

```text
browser (this app) -> bff/ -> forge-api-gateway
```

## Layout

- `src/` — the React app (Vite + TypeScript)
  - `schemas/ai_response.ts` — mirrors `ChatRequest`/`ChatResponse` from
    forge-api-gateway's `app/api/chat.py` (the actual implemented contract,
    not the aspirational shape in `ARCHITECTURE.md` §3 — update this file if
    that contract changes)
  - `components/` — `SourcesPanel`, `ActionsRow`, `TransparencyLine`,
    `ChatMessage`, `ChatView` (render-only; no routing/backend logic)
  - `admin/` — code-split (`React.lazy`) review-queue UI, shown when the
    selected persona is `admin`
  - `lib/apiClient.ts` — the only place that calls the BFF
- `bff/server.mjs` — stateless BFF: proxies a fixed endpoint allowlist to
  the gateway, meant to attach identity once Okta SSO is wired up
- `mock-gateway/server.mjs` — local stand-in for forge-api-gateway, mirrors
  its real contract so the UI/BFF can be developed and tested offline
  without touching the real service's Postgres/git state

## Running locally

```bash
npm install
cp .env.example .env        # VITE_API_BASE_URL -> the BFF

npm run mock-gateway         # terminal 1: fake gateway on :8787
npm run bff                  # terminal 2: BFF on :4000
npm run dev                  # terminal 3: Vite dev server
```

To point at a real forge-api-gateway instead of the mock, set
`GATEWAY_BASE_URL` when starting the BFF (`GATEWAY_BASE_URL=http://localhost:8001 npm run bff`),
or `http://gateway:8000`-style service name inside a shared docker-compose
network — never `localhost` there (see `ARCHITECTURE.md` §6.4).

### Docker Compose

```bash
docker compose up --build
```

Brings up `gateway` (mock, swap for the real service when available), `bff`,
and `ui` on one network. `VITE_API_BASE_URL` is set to the `bff` service name
inside that network; see the comment in `docker-compose.yml` if the browser
itself can't resolve that hostname (add a hosts entry or reverse proxy, or
run the UI outside Docker with `VITE_API_BASE_URL=http://localhost:4000`).

## Testing

```bash
npm test        # vitest: component tests + a self-contained end-to-end test
                 # that spawns mock-gateway + bff and drives a full
                 # approve-a-draft -> ask-again flow through the real UI code
npx tsc -b       # typecheck
npx oxlint       # lint
```

The end-to-end test never touches a real forge-api-gateway — it's fully
self-contained against the mock, so `npm test` has no side effects outside
this repo.

