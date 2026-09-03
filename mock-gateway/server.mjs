// Local stand-in for forge-api-gateway, used to verify the UI's end-to-end
// wiring (Steps 14-15) without mutating the real gateway's Postgres/git
// state. Mirrors the ACTUAL contract implemented in that repo's
// app/api/chat.py and app/admin/review_queue.py (confirmed against the
// running service), not the earlier/aspirational shape in ARCHITECTURE.md §3:
// - POST /ai/chat takes {question, team_id, persona, user_email, conversation_id}
//   and returns {answer, route, sources, gate_passed, score, conversation_id, message_id}
// - GET /admin/review-queue?team_id=... lists {review_id, team_id, target,
//   proposed_content, status}
// - POST /admin/review-queue/:id/approve-skill and .../reject, both requiring
//   a `role` in ADMIN_ROLES (client-supplied, not verified — a stopgap, same
//   trust model as team_id/persona/user_email elsewhere in that repo)
//
// Point VITE_API_BASE_URL/GATEWAY_BASE_URL at the real gateway to replace
// this — no UI changes should be needed.
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

const PORT = 8787;
const ADMIN_ROLES = new Set(["admin", "super_user"]);

let reviewQueue = [
  {
    review_id: "rq-1",
    team_id: "test",
    target: "new_skill",
    proposed_content:
      "The staging environment is refreshed nightly at 02:00 UTC from a prod snapshot.",
    status: "pending",
    topic: "staging refresh",
  },
];

const knowledgeBase = [];

function send(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    return send(res, 204, {});
  }

  if (req.method === "POST" && url.pathname === "/ai/chat") {
    const { question, conversation_id } = await readJson(req);
    const query = String(question ?? "").toLowerCase();
    const hit = knowledgeBase.find((entry) =>
      query.includes(entry.topic.toLowerCase()),
    );

    const response = hit
      ? {
          answer: hit.content,
          route: "skill_match",
          sources: [{ source_type: "skill", source_ref: hit.review_id }],
          gate_passed: true,
          score: 0.9,
          conversation_id: conversation_id ?? randomUUID(),
          message_id: randomUUID(),
        }
      : {
          answer:
            "I don't have a confident answer or an existing skill for that yet.",
          route: "draft_skill",
          sources: [],
          gate_passed: false,
          score: 0.0,
          conversation_id: conversation_id ?? randomUUID(),
          message_id: randomUUID(),
        };

    return send(res, 200, response);
  }

  if (req.method === "GET" && url.pathname === "/admin/review-queue") {
    const teamId = url.searchParams.get("team_id") ?? "test";
    return send(
      res,
      200,
      reviewQueue.filter((item) => item.status === "pending" && item.team_id === teamId),
    );
  }

  const approveMatch = url.pathname.match(
    /^\/admin\/review-queue\/([^/]+)\/approve-skill$/,
  );
  if (req.method === "POST" && approveMatch) {
    const { edited_content, role } = await readJson(req);
    if (!ADMIN_ROLES.has(role)) {
      return send(res, 403, { error: `role ${role} is not permitted to approve_skill` });
    }
    const item = reviewQueue.find((i) => i.review_id === approveMatch[1]);
    if (!item) return send(res, 404, { error: "not found" });

    item.status = "approved";
    item.proposed_content = edited_content ?? item.proposed_content;
    knowledgeBase.push({
      review_id: item.review_id,
      topic: item.topic,
      content: item.proposed_content,
    });
    return send(res, 200, { status: "approved", skill_id: item.review_id });
  }

  const rejectMatch = url.pathname.match(
    /^\/admin\/review-queue\/([^/]+)\/reject$/,
  );
  if (req.method === "POST" && rejectMatch) {
    const { role } = await readJson(req);
    if (!ADMIN_ROLES.has(role)) {
      return send(res, 403, { error: `role ${role} is not permitted to reject_skill` });
    }
    const item = reviewQueue.find((i) => i.review_id === rejectMatch[1]);
    if (!item) return send(res, 404, { error: "not found" });

    item.status = "rejected";
    return send(res, 200, { status: "rejected", review_id: item.review_id });
  }

  send(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`mock-gateway listening on http://localhost:${PORT}`);
});
