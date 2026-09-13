import { createFileRoute } from "@tanstack/react-router";
import { deleteTask, listTasks, saveTask } from "@/lib/tasks.server";

export const Route = createFileRoute("/api/tasks")({ server: { handlers: {
  GET: async ({ request }) => { const url = new URL(request.url); return Response.json({ tasks: await listTasks(url.searchParams.get("workspaceId") || "default") }); },
  POST: async ({ request }) => { const body = await request.json().catch(() => null) as Record<string, unknown> | null; const workspaceId = String(body?.workspaceId || "default"); const action = String(body?.action || "create"); if (action === "delete") return Response.json({ tasks: await deleteTask(workspaceId, String(body?.taskId || "")) }); const task = await saveTask({ workspaceId, prompt: String(body?.prompt || ""), runAt: String(body?.runAt || new Date(Date.now() + 3600000).toISOString()), repeatMinutes: body?.repeatMinutes ? Number(body.repeatMinutes) : undefined, enabled: body?.enabled !== false }); return Response.json({ task }); },
} } });
