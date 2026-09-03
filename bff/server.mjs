// Stateless BFF (ARCHITECTURE.md §1-2): the only thing the browser talks to.
// No domain data, no Postgres, no routing/business decisions — it just
// shapes the request, attaches identity, and proxies to forge-api-gateway.
// Redis-backed request shaping can be added here later; none needed yet.
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4000);
const GATEWAY_BASE_URL = process.env.GATEWAY_BASE_URL ?? "http://localhost:8787";

// TODO: once Okta SSO is wired up, verify the session/cookie here and
// derive user_id/team_id server-side from the AD group — never trust
// anything the browser sends (§2, §9). The current forge-api-gateway
// doesn't read these headers yet (it trusts team_id/persona/user_email
// straight from the request body) — this is a placeholder for when it does.
function identityHeaders() {
  return {
    "X-Forge-User-Id": "stub-user",
    "X-Forge-Team-Id": "stub-team",
  };
}

function withCors(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;
}

// Known routes only — this proxies a fixed allowlist, it is not an open relay.
const ROUTES = [
  { method: "POST", pattern: /^\/ai\/chat$/ },
  { method: "GET", pattern: /^\/admin\/review-queue$/ },
  { method: "POST", pattern: /^\/admin\/review-queue\/[^/]+\/approve-skill$/ },
  { method: "POST", pattern: /^\/admin\/review-queue\/[^/]+\/reject$/ },
];

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return withCors(res, 204);
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const route = ROUTES.find((r) => r.method === req.method && r.pattern.test(url.pathname));

  if (!route) {
    return withCors(res, 404, { error: "not found" });
  }

  try {
    const body = await readBody(req);
    const upstream = await fetch(`${GATEWAY_BASE_URL}${url.pathname}${url.search}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...identityHeaders(),
      },
      body,
    });

    const text = await upstream.text();
    res.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(text);
  } catch (err) {
    withCors(res, 502, { error: "gateway unreachable", detail: String(err) });
  }
});

server.listen(PORT, () => {
  console.log(`bff listening on http://localhost:${PORT} -> ${GATEWAY_BASE_URL}`);
});
