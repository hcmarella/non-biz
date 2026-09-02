# Forge Enterprise AI Gateway — Master Reference

> Single source of truth. Upload to both repos as `docs/ARCHITECTURE.md`. Supersedes all earlier partial docs/diagrams. Covers: repo boundaries, architecture, API contract, build stages, debugging runbook, and non-negotiables.

---

## 1. Repo boundaries — the rule that resolves your current confusion

**Two repos, two jobs. Nothing about domain data is ever duplicated between them.**

| | UI Repo (`non-biz`) | API Gateway Repo |
|---|---|---|
| Owns | Business/Manager portal, BFF | All routing, retrieval, synthesis, connectors |
| Database | **None for domain data.** BFF is stateless — Redis only, if anything, for short-lived request shaping | **The only Postgres.** Sessions, knowledge_chunks, skills index, audit_log |
| Renders | `answer`, `sources`, `actions`, `type` from the API contract (§3) | N/A |
| Decides routing? | **Never.** No `if question.includes(...)` logic in the frontend | **Always.** All source/model/skill decisions happen here |
| New feature = | New UI component consuming an existing/extended contract field | New route, new connector, or new registry entry |

**If you ever find yourself needing to replicate a table/schema between the two repos, that's the signal something that belongs only in the Gateway has leaked into the UI's BFF. Fix the split, don't sync the schema.**

---

## 2. Architecture — full flow

```
Business Portal ──┐
                   ├──> BFF (stateless) ──> API Gateway
Manager Portal ────┘         │
                     Okta SSO attaches identity
                     (never trust browser-supplied role/team)
                              │
                              ▼
                    ┌─────────────────────┐
                    │     API GATEWAY      │  FastAPI + LangGraph
                    │  (the only backend)  │
                    ├─────────────────────┤
                    │ Intent Router (Haiku)│ → question / report / action / live?
                    │ Source Router        │ → reads registry/sources.yaml
                    │ Model Router         │ → fast / reasoning / embedding (config)
                    │ 6 Governance Gates   │ → Permission, Evidence, Freshness,
                    │                      │    Quality, Action, Memory
                    │ Response Formatter   │ → frozen AIResponse contract
                    └──────────┬──────────┘
                               │
       ┌───────────────┬───────┴────────┬──────────────────┐
       ▼               ▼                ▼                  ▼
      RAG            Skills          Live API           Reports
  (pgvector,     (SKILL.md, git-    (Jira/Confluence/  (Report Service,
   permission-    native, never      ServiceNow/       validated data,
   filtered)       embedded)         SharePoint MCP)    LLM narrates only)
       │
       ▼
  Amazon Bedrock (Claude Haiku → Sonnet)
```

### 2.1 Data source treatment — the rule that governs every connector

**If it's live, structured, changes fast → pull at query time, NEVER embed.**
**If it's durable prose knowledge → chunk, embed, retrieve by similarity.**

| Source | Treatment | Notes |
|---|---|---|
| Jira | `live` | Direct MCP call every request |
| ServiceNow | `live` | Same |
| SharePoint/Outlook | `live`, delegated OAuth | Per-user permissions, inherited from Graph |
| Confluence | `embed` | Chunked (~500 tok, 50 overlap), embedded into pgvector |
| VS Code repo `memory/*.md` | `embed` | Same pipeline as Confluence, `source_type='github_memory'` |
| VS Code repo `skills/personas/*.md` | **Neither** — read directly from disk | Copied natively into gateway repo; procedural, not retrievable knowledge |

---

## 3. The frozen API contract — never break this without a version bump

```json
{
  "conversation_id": "abc123",
  "message_id": "msg789",
  "type": "grounded_answer",
  "answer": "The current deployment process is...",
  "sources": [
    { "source_type": "github", "title": "Deployment Guide", "path": "docs/deployment.md", "citation": "..." }
  ],
  "actions": [
    { "id": "generate_report", "label": "Generate Report" }
  ],
  "confidence": 0.91,
  "metadata": {
    "route": "rag",
    "sources_used": ["github", "skills"],
    "model": "claude-sonnet-5",
    "latency_ms": 1240
  }
}
```
`type`: `grounded_answer` · `live_data` · `report` · `action_required` · `error` · `clarification`

**Enforce it in code, not just docs** — `app/schemas/ai_response.py` (Pydantic model) in the Gateway repo is the canonical definition. Copy the same file into the UI repo with a comment marking the source of truth, until a shared package exists.

---

## 4. Database schema (Gateway repo only)

```sql
-- Identity / tenancy
teams (team_id, jira_board_id, confluence_space, servicenow_group)
users (user_id, team_id, role)  -- role resolved server-side from AD group, never client-selected

-- Conversation memory
conversations (conversation_id, user_id, title, created_at)
messages (message_id, conversation_id, role, content, timestamp)
message_sources (message_id, document_id, chunk_id, relevance_score)

-- Enterprise knowledge (pgvector)
documents (document_id, repo, file_path, commit_sha, domain, classification)
access_control (document_id, okta_group, role)
knowledge_chunks (chunk_id, document_id, team_id, content, embedding VECTOR(1536), source_updated_at)

-- Procedural (metadata only — full content stays in git, read directly)
persona_index (persona_id, name, description, team_id, source_path, embedding)

-- Governance
audit_log (audit_id, user_id, team_id, action_type, gate_results, approved_by, created_at)
content_review_queue (review_id, submitted_by, team_id, proposed_content, status, reviewed_by)
sync_runs (sync_id, source_type, team_id, started_at, completed_at, status)
```

**Critical: verify `VECTOR(1536)` matches your actual embedding model's output dimension.** Run this after any embedding-model change:
```sql
SELECT vector_dims(embedding) FROM knowledge_chunks LIMIT 5;
```
If it doesn't match the column definition, that's a confirmed bug — truncate, fix the column type, rebuild the HNSW index, re-ingest.

---

## 5. Build order — mock-first, one phase verified before the next

```
0. Local docker-compose reproducible: portal + BFF + gateway + Postgres+pgvector + MOCK connectors
1. Freeze the AIResponse contract as a shared schema
2. /ai/chat with MOCK Intent Router + mock Source Router + mock citations
3. UI renders sources/actions/type from the mock
     → CHECKPOINT: confirm UI needs no further changes from here forward
4. pgvector + embeddings, tested against 10–20 real files only
     → CHECKPOINT: cosine sanity check (paraphrases >0.85, unrelated <0.4)
5. Real Bedrock call replaces the mock synthesis
6. Skills registry (SKILL.md discovery)
7. Okta/AD authorization + permission-filtered retrieval (before/during, never after)
8. Live connectors, one at a time: Jira → Confluence → ServiceNow → SharePoint
9. Reports service
10. Move to DEV (EKS, gateway only first, then Postgres/Redis/supporting services)
11. RBAC/leakage test suite in CI
12. STG → PROD
```

---

## 6. Debugging runbook — lessons already learned, check these first

**"UI gets no data from the gateway" — isolate in this order:**
1. `curl` the gateway's `/ai/chat` directly, bypassing the UI — does it return anything?
2. If curl fails: bug is gateway-side (classification, connector, or DB)
3. If curl works: check browser Network tab — request never fires (frontend bug) / fires but times out (network/Docker) / gets response but renders nothing (contract mismatch)
4. **Docker networking**: `VITE_API_BASE_URL` must use the service name (`http://gateway:8000`) inside `docker-compose`'s network, never `localhost` — this is the most common cause of "works in curl, not in browser" in this exact setup
5. **CORS**: `allow_origins` must exactly match the browser's actual origin; check Network tab for an explicit CORS error
6. **Contract mismatch**: confirm the gateway actually returns the shape in §3 — a response like `{"result": "..."}` instead of `{"answer": "...", "sources": [...]}` will silently fail to render

**"Answers aren't grounded / retrieval broken" — isolate in this order:**
1. Confirm data actually exists: `SELECT count(*) FROM knowledge_chunks WHERE team_id = 'x'`
2. Confirm embedding dimension matches (§4 sanity check)
3. Confirm the SAME embedding model is used at ingestion time and query time
4. Confirm the router is actually reaching the retrieval branch — add a debug log at the classification step; if a knowledge question is silently defaulting to a different path (e.g. always hitting Jira), that's a routing gap, not a retrieval bug
5. Confirm no duplicate chunks: `SELECT content, COUNT(*) FROM knowledge_chunks GROUP BY content HAVING COUNT(*) > 1`

---

## 7. Infrastructure

- **EKS**, one Helm chart, `values-{dev,stg,prod}.yaml` per environment — same container image promoted through all three, never rebuilt per environment
- **RDS Postgres+pgvector**, outside the cluster — not a Postgres pod in Kubernetes
- **IRSA** — one IAM role per service per environment, scoped to `bedrock:InvokeModel` and relevant Secrets Manager entries only
- **Namespace-per-environment**, NetworkPolicy denying cross-namespace traffic by default
- **DNS convention**: `forge-gateway-{env}.k8s.internal.capitalgroup.com` (no suffix = prod)
- **CI/CD**: `commit → lint + unit tests + security scan + Docker build → ECR → deploy → smoke tests → manual approval → next environment`

---

## 8. Cost &amp; ROI (pilot scale, ~500 users)

| Item | Monthly |
|---|---|
| Bedrock inference (Sonnet 5) | $50–210 |
| RDS Postgres+pgvector | $50–150 |
| EKS gateway compute | $30–60 |
| Redis | $15–30 |
| **Total** | **~$180–450** |

vs. Copilot Business/Enterprise seats at 500 users: **$9,500–19,500/month** — Forge is ~20–30x cheaper, and scales with actual usage, not headcount.

---

## 9. Non-negotiables

- Trust is the product — cited evidence only; say "unverified" rather than guess
- Human-in-the-loop before any mutation
- Authorization enforced before/during retrieval, never after
- Tenant isolation (`team_id`) at the query layer, every table
- Skills read directly from git, never embedded; knowledge embedded, never hardcoded as logic
- Reports: LLM narrates validated data, never generates the numbers
- One Postgres (Gateway repo only) — never replicated into the UI repo
- No Bedrock AgentCore token vault — the gateway owns all tool/MCP calls directly
- Config-driven sources (`registry/sources.yaml`) and models — new source/model = config change, not new code paths scattered through the router

---

## 10. Immediate next actions

1. Fix the repo boundary: remove domain-data Postgres from the UI repo's BFF, confirm Gateway repo is the only database
2. Run the debugging runbook (§6) against the current "no data from gateway" issue — start with the direct `curl` test
3. Confirm `AIResponse` contract is enforced as a Pydantic model in the Gateway repo, mirrored (not duplicated logic, just the schema file) in the UI repo
4. Once data flows end-to-end locally: request DEV EKS access using the DNS/IRSA convention in §7
5. Add the RBAC/leakage test suite before onboarding a second team
