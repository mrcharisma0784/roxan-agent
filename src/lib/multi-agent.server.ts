import { randomUUID } from "node:crypto";

export type AgentRole = "explorer" | "coder" | "tester" | "reviewer" | "researcher";

export type AgentSubtask = {
  id: string;
  role: AgentRole;
  goal: string;
  dependsOn: string[];
  status: "queued" | "running" | "done" | "failed";
};

const ROLE_HINTS: Record<AgentRole, string> = {
  explorer: "Inspect workspace structure, identify relevant files and constraints.",
  coder: "Implement the requested changes while preserving existing behavior.",
  tester: "Run the narrowest useful checks and report failures with evidence.",
  reviewer: "Review the result for regressions, missing requirements and unsafe assumptions.",
  researcher: "Gather and compare external evidence when the task depends on current information.",
};

export function buildDelegationPlan(goal: string, roles: AgentRole[] = ["explorer", "coder", "tester", "reviewer"]): AgentSubtask[] {
  const uniqueRoles = [...new Set(roles)];
  const subtasks: AgentSubtask[] = [];
  let previous: string[] = [];
  for (const role of uniqueRoles) {
    const id = randomUUID();
    subtasks.push({ id, role, goal: `${ROLE_HINTS[role]}\nTask: ${goal}`, dependsOn: [...previous], status: "queued" });
    previous = [id];
  }
  return subtasks;
}

export function nextRunnableSubtasks(subtasks: AgentSubtask[]): AgentSubtask[] {
  const completed = new Set(subtasks.filter((task) => task.status === "done").map((task) => task.id));
  return subtasks.filter((task) => task.status === "queued" && task.dependsOn.every((id) => completed.has(id)));
}

export function markSubtask(subtasks: AgentSubtask[], id: string, status: AgentSubtask["status"]): AgentSubtask[] {
  return subtasks.map((task) => task.id === id ? { ...task, status } : task);
}
