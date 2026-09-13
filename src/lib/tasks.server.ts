import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type AgentTask = { id: string; workspaceId: string; prompt: string; runAt: string; repeatMinutes?: number; enabled: boolean; createdAt: string; status?: "queued" | "running" | "done" | "error" | "cancelled"; runCount?: number; lastRunAt?: string; lastError?: string; nextRunAt?: string };

function taskFile(workspaceId: string) {
  const root = process.env.ROXAN_WORKSPACES_ROOT || path.join(process.env.TMPDIR || "/tmp", "roxan-workspaces");
  const safe = workspaceId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "default";
  return path.join(root, safe, ".roxan", "tasks.json");
}

export async function listTasks(workspaceId: string) {
  const file = taskFile(workspaceId);
  try { return JSON.parse(await fs.readFile(file, "utf8")) as AgentTask[]; } catch { return []; }
}

export async function saveTask(input: Omit<AgentTask, "id" | "createdAt">) {
  const file = taskFile(input.workspaceId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tasks = await listTasks(input.workspaceId);
  const task: AgentTask = { ...input, id: randomUUID(), createdAt: new Date().toISOString(), status: "queued", runCount: 0, nextRunAt: input.runAt };
  await fs.writeFile(file, JSON.stringify([...tasks, task], null, 2), "utf8");
  return task;
}

export async function deleteTask(workspaceId: string, id: string) {
  const file = taskFile(workspaceId);
  const tasks = (await listTasks(workspaceId)).filter((task) => task.id !== id);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(tasks, null, 2), "utf8");
  return tasks;
}


export async function updateTask(workspaceId: string, id: string, patch: Partial<AgentTask>) {
  const file = taskFile(workspaceId);
  const tasks = (await listTasks(workspaceId)).map((task) => task.id === id ? { ...task, ...patch, id, workspaceId } : task);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(tasks, null, 2), "utf8");
  return tasks.find((task) => task.id === id) || null;
}

export async function claimDueTasks(workspaceId: string, now = Date.now(), limit = 3) {
  const tasks = await listTasks(workspaceId);
  const due = tasks.filter((task) => task.enabled && task.status !== "running" && new Date(task.nextRunAt || task.runAt).getTime() <= now).slice(0, limit);
  const claimed: AgentTask[] = [];
  for (const task of due) {
    const next = await updateTask(workspaceId, task.id, { status: "running", lastRunAt: new Date(now).toISOString(), runCount: (task.runCount || 0) + 1 });
    if (next) claimed.push(next);
  }
  return claimed;
}

export async function finishTask(workspaceId: string, id: string, ok: boolean, summary?: string) {
  const current = (await listTasks(workspaceId)).find((task) => task.id === id);
  if (!current) return null;
  const nextRunAt = current.repeatMinutes && current.repeatMinutes >= 60 ? new Date(Date.now() + current.repeatMinutes * 60_000).toISOString() : undefined;
  return updateTask(workspaceId, id, { status: ok ? "done" : "error", enabled: Boolean(nextRunAt), nextRunAt, lastError: ok ? summary : summary });
}
