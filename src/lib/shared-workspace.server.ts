import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type WorkspaceMember = { id: string; name: string; email?: string; role: "owner" | "editor" | "viewer"; joinedAt: string };
export type SharedWorkspace = { workspaceId: string; name: string; ownerId: string; members: WorkspaceMember[]; updatedAt: string };

function fileFor(workspaceDir: string) { return path.join(workspaceDir, ".roxan", "shared-workspace.json"); }

export async function getSharedWorkspace(workspaceDir: string, workspaceId: string): Promise<SharedWorkspace> {
  try { return JSON.parse(await fs.readFile(fileFor(workspaceDir), "utf8")) as SharedWorkspace; }
  catch {
    const now = new Date().toISOString();
    return { workspaceId, name: workspaceId, ownerId: "local", members: [{ id: "local", name: "Owner", role: "owner", joinedAt: now }], updatedAt: now };
  }
}

export async function saveSharedWorkspace(workspaceDir: string, workspace: SharedWorkspace) {
  const file = fileFor(workspaceDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const next = { ...workspace, updatedAt: new Date().toISOString() };
  await fs.writeFile(file, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export async function addWorkspaceMember(workspaceDir: string, workspaceId: string, input: Omit<WorkspaceMember, "id" | "joinedAt">) {
  const workspace = await getSharedWorkspace(workspaceDir, workspaceId);
  const member = { ...input, id: randomUUID(), joinedAt: new Date().toISOString() } satisfies WorkspaceMember;
  workspace.members.push(member);
  return saveSharedWorkspace(workspaceDir, workspace);
}

export async function removeWorkspaceMember(workspaceDir: string, workspaceId: string, memberId: string) {
  const workspace = await getSharedWorkspace(workspaceDir, workspaceId);
  workspace.members = workspace.members.filter((member) => member.id !== memberId || member.role === "owner");
  return saveSharedWorkspace(workspaceDir, workspace);
}
