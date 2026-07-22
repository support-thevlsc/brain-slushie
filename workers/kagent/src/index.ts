export interface Env {
  ENVIRONMENT: string;
  OWNER_PRINCIPAL: string;
  KAGENT_PRINCIPAL: string;
  HOMUNCUL_PRINCIPAL: string;
  CHATVLSC_PRINCIPAL: string;
  RISK_REVIEW_THRESHOLD: string;
  ACCESS_AUD?: string;
  OWNER_NOTIFICATION_WEBHOOK?: string;
  AI: Ai;
}

type PrincipalRole = "owner" | "kagent" | "homuncul" | "chatvlsc" | "agent" | "anonymous";
type Reviewer = "kagent" | "homuncul" | "chatvlsc";
type Decision = "approve" | "reject" | "abstain";

interface IdentityContext { email: string | null; role: PrincipalRole; }
interface Proposal {
  id: string;
  summary: string;
  risk: number;
  changes: string[];
  reviews?: Partial<Record<Reviewer, Decision>>;
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer"
  }
});

function identityFromRequest(request: Request, env: Env): IdentityContext {
  const email = request.headers.get("cf-access-authenticated-user-email");
  if (!email) return { email: null, role: "anonymous" };
  const value = email.toLowerCase();
  if (value === env.OWNER_PRINCIPAL.toLowerCase()) return { email, role: "owner" };
  if (value === env.KAGENT_PRINCIPAL.toLowerCase()) return { email, role: "kagent" };
  if (value === env.HOMUNCUL_PRINCIPAL.toLowerCase()) return { email, role: "homuncul" };
  if (value === env.CHATVLSC_PRINCIPAL.toLowerCase()) return { email, role: "chatvlsc" };
  return { email, role: "agent" };
}

function requireRole(identity: IdentityContext, allowed: PrincipalRole[]): Response | null {
  return allowed.includes(identity.role) ? null : json({ error: "forbidden", requiredRoles: allowed }, 403);
}

function evaluateProposal(proposal: Proposal, threshold: number) {
  if (!Number.isFinite(proposal.risk) || proposal.risk < 0 || proposal.risk > 10) {
    return { status: "invalid", reason: "risk must be between 0 and 10" } as const;
  }
  if (proposal.risk < threshold) return { status: "eligible", requiresMeeting: false } as const;

  const reviews = proposal.reviews ?? {};
  const required: Reviewer[] = ["homuncul", "chatvlsc", "kagent"];
  const missing = required.filter((reviewer) => !reviews[reviewer]);
  if (missing.length) return { status: "blocked", requiresMeeting: true, missing } as const;

  const decisions = required.map((reviewer) => reviews[reviewer]);
  if (decisions.every((decision) => decision === "approve")) {
    return { status: "eligible", requiresMeeting: true } as const;
  }
  return {
    status: "owner_decision_required",
    requiresMeeting: true,
    blockage: reviews
  } as const;
}

async function notifyOwner(env: Env, proposal: Proposal, evaluation: unknown): Promise<boolean> {
  if (!env.OWNER_NOTIFICATION_WEBHOOK) return false;
  const response = await fetch(env.OWNER_NOTIFICATION_WEBHOOK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      recipient: env.OWNER_PRINCIPAL,
      event: "kagent.owner_decision_required",
      proposal: { id: proposal.id, summary: proposal.summary, risk: proposal.risk, changes: proposal.changes },
      evaluation
    })
  });
  return response.ok;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const identity = identityFromRequest(request, env);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ service: "thevlsc-kagent", status: "ok", environment: env.ENVIRONMENT });
    }

    if (request.method === "GET" && url.pathname === "/v1/whoami") {
      const denied = requireRole(identity, ["owner", "kagent", "homuncul", "chatvlsc", "agent"]);
      return denied ?? json({ principal: identity.email, role: identity.role });
    }

    if (request.method === "POST" && url.pathname === "/v1/governance/evaluate") {
      const denied = requireRole(identity, ["owner", "kagent", "homuncul", "chatvlsc"]);
      if (denied) return denied;
      const proposal = await request.json<Proposal>();
      const evaluation = evaluateProposal(proposal, Number(env.RISK_REVIEW_THRESHOLD || "8"));
      const notified = evaluation.status === "owner_decision_required"
        ? await notifyOwner(env, proposal, evaluation)
        : false;
      return json({ proposalId: proposal.id, evaluation, ownerNotificationQueued: notified }, evaluation.status === "eligible" ? 200 : 202);
    }

    if (request.method === "POST" && url.pathname === "/v1/ai/optimize") {
      const denied = requireRole(identity, ["owner", "kagent"]);
      if (denied) return denied;
      const input = await request.json<{ objective: string; sanitizedContext?: string }>();
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: "Recommend safe Cloudflare configuration optimizations. Never request secrets. Flag any action with risk 8 or higher for governance review." },
          { role: "user", content: `${input.objective}\n${input.sanitizedContext ?? ""}` }
        ]
      });
      return json({ advisoryOnly: true, result });
    }

    if (request.method === "POST" && url.pathname === "/v1/admin/deploy-intent") {
      const denied = requireRole(identity, ["owner", "kagent"]);
      if (denied) return denied;
      return json({ accepted: true, requestedBy: identity.email, note: "Intent recorded. GitHub production approval remains mandatory." }, 202);
    }

    return json({ error: "not_found" }, 404);
  }
} satisfies ExportedHandler<Env>;
