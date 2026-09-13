import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type MaintenancePlan = {
  id: string;
  workspaceId: string;
  name: string;
  prompt: string;
  intervalMinutes: number;
  enabled: boolean;
  createdAt: string;
  lastRunAt?: string;
  lastStatus?: "ok" | "error";
  lastSummary?: string;
};

function fileFor(workspaceId: string) {
  const root = process.env.ROXAN_WORKSPACES_ROOT || path.join(process.env.TMPDIR || "/tmp", "roxan-workspaces");
  const safe = workspaceId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "default";
  return path.join(root, safe, ".roxan", "maintenance.json");
}

export async function listMaintenancePlans(workspaceId: string): Promise<MaintenancePlan[]> {
  try { return JSON.parse(await fs.readFile(fileFor(workspaceId), "utf8")) as MaintenancePlan[]; } catch { return []; }
}

export async function saveMaintenancePlan(input: Omit<MaintenancePlan, "id" | "createdAt">) {
  const file = fileFor(input.workspaceId);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const plan: MaintenancePlan = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  const plans = await listMaintenancePlans(input.workspaceId);
  await fs.writeFile(file, JSON.stringify([...plans, plan], null, 2), "utf8");
  return plan;
}

export async function updateMaintenancePlan(workspaceId: string, id: string, patch: Partial<MaintenancePlan>) {
  const file = fileFor(workspaceId);
  const plans = (await listMaintenancePlans(workspaceId)).map((item) => item.id === id ? { ...item, ...patch, id, workspaceId } : item);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(plans, null, 2), "utf8");
  return plans.find((item) => item.id === id) || null;
}

export async function deleteMaintenancePlan(workspaceId: string, id: string) {
  const file = fileFor(workspaceId);
  const plans = (await listMaintenancePlans(workspaceId)).filter((item) => item.id !== id);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(plans, null, 2), "utf8");
  return plans;
}
