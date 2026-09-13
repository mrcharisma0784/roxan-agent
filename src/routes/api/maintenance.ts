import { createFileRoute } from "@tanstack/react-router";
import { deleteMaintenancePlan, listMaintenancePlans, saveMaintenancePlan } from "@/lib/autonomous-maintenance.server";

export const Route = createFileRoute("/api/maintenance")({ server: { handlers: {
  GET: async ({ request }) => {
    const workspaceId = new URL(request.url).searchParams.get("workspaceId") || "default";
    return Response.json({ plans: await listMaintenancePlans(workspaceId) });
  },
  POST: async ({ request }) => {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const workspaceId = String(body?.workspaceId || "default");
    const action = String(body?.action || "create");
    if (action === "delete") return Response.json({ plans: await deleteMaintenancePlan(workspaceId, String(body?.planId || "")) });
    const plan = await saveMaintenancePlan({ workspaceId, name: String(body?.name || "Roxan Maintenance"), prompt: String(body?.prompt || "Check the workspace for regressions and report actionable fixes."), intervalMinutes: Math.max(60, Number(body?.intervalMinutes) || 1440), enabled: body?.enabled !== false });
    return Response.json({ plan });
  },
  PATCH: async ({ request }) => {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const workspaceId = String(body?.workspaceId || "default");
    const plans = await listMaintenancePlans(workspaceId);
    const id = String(body?.planId || "");
    const plan = plans.find((item) => item.id === id);
    if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
    plan.lastRunAt = String(body?.lastRunAt || new Date().toISOString());
    plan.lastStatus = body?.lastStatus === "error" ? "error" : "ok";
    plan.lastSummary = String(body?.lastSummary || "");
    const { updateMaintenancePlan } = await import("@/lib/autonomous-maintenance.server");
    return Response.json({ plan: await updateMaintenancePlan(workspaceId, id, plan) });
  },
} } });
