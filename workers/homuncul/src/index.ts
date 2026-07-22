export interface Env {
  ENVIRONMENT: string;
  OWNER_PRINCIPAL: string;
  HOMUNCUL_PRINCIPAL: string;
  KAGENT_PRINCIPAL: string;
  CHATVLSC_PRINCIPAL: string;
  RISK_REVIEW_THRESHOLD: string;
  OWNER_NOTIFICATION_WEBHOOK?: string;
  AI: Ai;
}

type Reviewer = "homuncul" | "chatvlsc" | "kagent";
type Decision = "approve" | "reject" | "abstain";
type Role = "owner" | Reviewer | "member" | "anonymous";

interface ChangeProposal {
  id: string;
  summary: string;
  risk: number;
  target: string;
  changes: string[];
  reviews?: Partial<Record<Reviewer, Decision>>;
}

const headers = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers });

function identity(request: Request, env: Env): { email: string | null; role: Role } {
  const email = request.headers.get("cf-access-authenticated-user-email");
  if (!email) return { email: null, role: "anonymous" };
  const normalized = email.toLowerCase();
  if (normalized === env.OWNER_PRINCIPAL.toLowerCase()) return { email, role: "owner" };
  if (normalized === env.HOMUNCUL_PRINCIPAL.toLowerCase()) return { email, role: "homuncul" };
  if (normalized === env.KAGENT_PRINCIPAL.toLowerCase()) return { email, role: "kagent" };
  if (normalized === env.CHATVLSC_PRINCIPAL.toLowerCase()) return { email, role: "chatvlsc" };
  return { email, role: "member" };
}

function authorize(role: Role, allowed: Role[]): Response | null {
  return allowed.includes(role) ? null : json({ error: "forbidden", allowed }, 403);
}

function evaluate(proposal: ChangeProposal, threshold: number) {
  if (!Number.isFinite(proposal.risk) || proposal.risk < 0 || proposal.risk > 10) {
    return { status: "invalid", reason: "risk must be between 0 and 10" } as const;
  }
  if (proposal.risk < threshold) {
    return { status: "eligible_for_automation", meetingRequired: false } as const;
  }
  const required: Reviewer[] = ["homuncul", "chatvlsc", "kagent"];
  const reviews = proposal.reviews ?? {};
  const missing = required.filter((reviewer) => !reviews[reviewer]);
  if (missing.length) return { status: "meeting_required", meetingRequired: true, missing } as const;
  if (required.every((reviewer) => reviews[reviewer] === "approve")) {
    return { status: "eligible_after_consensus", meetingRequired: true } as const;
  }
  return {
    status: "owner_decision_required",
    meetingRequired: true,
    blockage: reviews
  } as const;
}

async function notifyOwner(env: Env, proposal: ChangeProposal, evaluation: unknown): Promise<boolean> {
  if (!env.OWNER_NOTIFICATION_WEBHOOK) return false;
  const response = await fetch(env.OWNER_NOTIFICATION_WEBHOOK, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      recipient: env.OWNER_PRINCIPAL,
      title: "TheVLSC configuration decision required",
      proposal: {
        id: proposal.id,
        summary: proposal.summary,
        target: proposal.target,
        risk: proposal.risk,
        changes: proposal.changes
      },
      blockage: evaluation
    })
  });
  return response.ok;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const actor = identity(request, env);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ service: "thevlsc-homuncul", status: "ok", environment: env.ENVIRONMENT });
    }

    if (request.method === "GET" && url.pathname === "/v1/policy") {
      const denied = authorize(actor.role, ["owner", "homuncul", "kagent", "chatvlsc"]);
      return denied ?? json({
        highRiskThreshold: Number(env.RISK_REVIEW_THRESHOLD || "8"),
        reviewers: ["homuncul", "chatvlsc", "kagent"],
        consensusRequired: true,
        ownerEscalation: env.OWNER_PRINCIPAL,
        mutationMode: "proposal-only"
      });
    }

    if (request.method === "POST" && url.pathname === "/v1/configuration/proposals/evaluate") {
      const denied = authorize(actor.role, ["owner", "homuncul", "kagent", "chatvlsc"]);
      if (denied) return denied;
      const proposal = await request.json<ChangeProposal>();
      const result = evaluate(proposal, Number(env.RISK_REVIEW_THRESHOLD || "8"));
      const notified = result.status === "owner_decision_required"
        ? await notifyOwner(env, proposal, result)
        : false;
      return json({ proposalId: proposal.id, result, ownerNotificationSent: notified }, result.status.includes("eligible") ? 200 : 202);
    }

    if (request.method === "POST" && url.pathname === "/v1/cloudflare/optimize") {
      const denied = authorize(actor.role, ["owner", "homuncul"]);
      if (denied) return denied;
      const body = await request.json<{ objective: string; sanitizedConfiguration?: string }>();
      const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          {
            role: "system",
            content: "Act as an advisory Cloudflare configuration optimizer. Use only sanitized input, never request secrets, never execute mutations, and label every recommendation with a 0-10 risk score. Risk 8 or higher requires Homuncul, ChatVLSC, and Kagent consensus."
          },
          { role: "user", content: `${body.objective}\n${body.sanitizedConfiguration ?? ""}` }
        ]
      });
      return json({ advisoryOnly: true, implementationRequiresProposal: true, result });
    }

    if (request.method === "POST" && url.pathname === "/v1/configuration/intents") {
      const denied = authorize(actor.role, ["owner", "homuncul"]);
      if (denied) return denied;
      return json({
        accepted: true,
        requestedBy: actor.email,
        execution: "disabled",
        nextStep: "evaluate proposal, obtain required approvals, then run the protected GitHub deployment environment"
      }, 202);
    }

    return json({ error: "not_found" }, 404);
  }
} satisfies ExportedHandler<Env>;
