import { createFileRoute } from "@tanstack/react-router";
import { buildDelegationPlan } from "@/lib/multi-agent.server";
import { listTasks } from "@/lib/tasks.server";

export const Route = createFileRoute("/api/agent")({ server: { handlers: {
  POST: async ({ request }) => {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const action = String(body?.action || "delegate");
    const workspaceId = String(body?.workspaceId || "default");
    if (action === "delegate") {
      const roles = Array.isArray(body?.roles) ? body.roles.map(String) : undefined;
      return Response.json({ plan: buildDelegationPlan(String(body?.goal || ""), roles as any) });
    }
    if (action === "jobs") return Response.json({ jobs: await listTasks(workspaceId) });
    return Response.json({ ok: false, error: "Unknown agent action" }, { status: 400 });
  },
} } });
