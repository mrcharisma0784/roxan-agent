import { createFileRoute } from "@tanstack/react-router";
import { getSharedWorkspace, addWorkspaceMember, removeWorkspaceMember } from "@/lib/shared-workspace.server";
import { BUILTIN_SKILLS, installSkill, listInstalledSkills, uninstallSkill } from "@/lib/skills-marketplace.server";
import { promises as fs } from "node:fs";
import path from "node:path";

function workdir(workspaceId: string) {
  const root = process.env.ROXAN_WORKSPACES_ROOT || path.join(process.env.TMPDIR || "/tmp", "roxan-workspaces");
  const safe = workspaceId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "default";
  return path.join(root, safe);
}

export const Route = createFileRoute("/api/workspace")({ server: { handlers: {
  GET: async ({ request }) => {
    const workspaceId = new URL(request.url).searchParams.get("workspaceId") || "default";
    const dir = workdir(workspaceId);
    return Response.json({ workspace: await getSharedWorkspace(dir, workspaceId), catalog: BUILTIN_SKILLS, installed: await listInstalledSkills(dir) });
  },
  POST: async ({ request }) => {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    const workspaceId = String(body?.workspaceId || "default");
    const dir = workdir(workspaceId);
    const action = String(body?.action || "");
    if (action === "skill_install") return Response.json({ skill: await installSkill(dir, String(body?.id || "")) });
    if (action === "skill_uninstall") return Response.json({ ids: await uninstallSkill(dir, String(body?.id || "")) });
    if (action === "member_add") return Response.json({ workspace: await addWorkspaceMember(dir, workspaceId, { name: String(body?.name || "Member"), email: body?.email ? String(body.email) : undefined, role: body?.role === "editor" ? "editor" : "viewer" }) });
    if (action === "member_remove") return Response.json({ workspace: await removeWorkspaceMember(dir, workspaceId, String(body?.memberId || "")) });
    await fs.mkdir(path.join(dir, ".roxan"), { recursive: true });
    return Response.json({ ok: true });
  },
} } });
