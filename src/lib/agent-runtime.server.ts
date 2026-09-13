export type ToolRegistryEntry = {
  id: string;
  requires?: string[];
  parallel?: boolean;
  retryable?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
};

export const TOOL_REGISTRY: Record<string, ToolRegistryEntry> = {
  file_read: { id: "file_read", parallel: true, retryable: true },
  file_create: { id: "file_create", requires: [], parallel: false, retryable: true },
  file_edit: { id: "file_edit", requires: ["file_read"], parallel: false, retryable: true },
  file_delete: { id: "file_delete", requires: ["file_read"], parallel: false, retryable: false },
  file_move: { id: "file_move", requires: ["file_read"], parallel: false, retryable: false },
  dir_list: { id: "dir_list", parallel: true, retryable: true },
  dir_create: { id: "dir_create", parallel: false, retryable: true },
  dir_delete: { id: "dir_delete", requires: ["dir_list"], parallel: false, retryable: false },
  dir_move: { id: "dir_move", requires: ["dir_list"], parallel: false, retryable: false },
  explore: { id: "explore", parallel: true, retryable: true },
  workspace_instructions_read: { id: "workspace_instructions_read", parallel: true, retryable: true },
  command_exec: { id: "command_exec", parallel: false, retryable: true, maxRetries: 1 },
  zip_create: { id: "zip_create", parallel: false, retryable: true },
  zip_extract: { id: "zip_extract", parallel: false, retryable: false },
  page_navigate: { id: "page_navigate", parallel: false, retryable: true },
  dom_inspect: { id: "dom_inspect", requires: ["page_navigate"], parallel: true, retryable: true },
  element_click: { id: "element_click", requires: ["page_navigate", "dom_inspect"], parallel: false, retryable: true },
  form_type: { id: "form_type", requires: ["page_navigate", "dom_inspect"], parallel: false, retryable: true },
  element_hover: { id: "element_hover", requires: ["page_navigate", "dom_inspect"], parallel: false, retryable: true },
  page_scroll: { id: "page_scroll", requires: ["page_navigate"], parallel: false, retryable: true },
  screenshot: { id: "screenshot", requires: ["page_navigate"], parallel: true, retryable: true },
  image_view: { id: "image_view", parallel: true, retryable: true },
  browser_vision: { id: "browser_vision", requires: ["page_navigate"], parallel: false, retryable: true },
  planning: { id: "planning", parallel: false, retryable: true },
  reasoning: { id: "reasoning", parallel: false, retryable: true },
  skills_load: { id: "skills_load", parallel: false, retryable: true },
  skills_unload: { id: "skills_unload", parallel: false, retryable: true },
  api_request: { id: "api_request", parallel: true, retryable: true },
  deploy: { id: "deploy", parallel: false, retryable: false },
  project_archive: { id: "project_archive", parallel: false, retryable: true },
  web_search: { id: "web_search", parallel: true, retryable: true, maxRetries: 2 },
  ask: { id: "ask", parallel: false, retryable: false },
  artifact_create: { id: "artifact_create", parallel: false, retryable: true },
  artifact_list: { id: "artifact_list", parallel: true, retryable: true },
  browser_back: { id: "browser_back", requires: ["page_navigate"], parallel: false, retryable: true },
  browser_forward: { id: "browser_forward", requires: ["page_navigate"], parallel: false, retryable: true },
  browser_reload: { id: "browser_reload", requires: ["page_navigate"], parallel: false, retryable: true },
  browser_tab_close: { id: "browser_tab_close", parallel: false, retryable: true },
  browser_tab_open: { id: "browser_tab_open", parallel: false, retryable: true },
  browser_tab_switch: { id: "browser_tab_switch", parallel: false, retryable: true },
  browser_tabs: { id: "browser_tabs", parallel: true, retryable: true },
  deep_research: { id: "deep_research", parallel: false, retryable: true },
  workspace_checkpoint_create: { id: "workspace_checkpoint_create", parallel: false, retryable: true },
  workspace_checkpoint_list: { id: "workspace_checkpoint_list", parallel: true, retryable: true },
  workspace_checkpoint_restore: { id: "workspace_checkpoint_restore", parallel: false, retryable: false },
  agent_task_create: { id: "agent_task_create", parallel: false, retryable: true },
  agent_task_list: { id: "agent_task_list", parallel: true, retryable: true },
  agent_task_delete: { id: "agent_task_delete", parallel: false, retryable: false },
  agent_delegate: { id: "agent_delegate", parallel: false, retryable: true },
  agent_job_create: { id: "agent_job_create", parallel: false, retryable: true },
  agent_job_list: { id: "agent_job_list", parallel: true, retryable: true },
  agent_job_cancel: { id: "agent_job_cancel", parallel: false, retryable: false },
  maintenance_plan_create: { id: "maintenance_plan_create", parallel: false, retryable: true },
  maintenance_plan_list: { id: "maintenance_plan_list", parallel: true, retryable: true },
  maintenance_plan_delete: { id: "maintenance_plan_delete", parallel: false, retryable: false },
  skill_catalog: { id: "skill_catalog", parallel: true, retryable: true },
  skill_install: { id: "skill_install", parallel: false, retryable: true },
  skill_uninstall: { id: "skill_uninstall", parallel: false, retryable: false },
  workspace_members: { id: "workspace_members", parallel: true, retryable: true },
  workspace_member_add: { id: "workspace_member_add", parallel: false, retryable: false },
  workspace_member_remove: { id: "workspace_member_remove", parallel: false, retryable: false },
  workspace_memory_recall: { id: "workspace_memory_recall", parallel: true, retryable: true },
  workspace_memory_save: { id: "workspace_memory_save", parallel: false, retryable: true },
  workspace_memory_list: { id: "workspace_memory_list", parallel: true, retryable: true },
  memory_add: { id: "memory_add", parallel: false, retryable: true },
  memory_recall: { id: "memory_recall", parallel: true, retryable: true },
  memory_edit: { id: "memory_edit", parallel: false, retryable: true },
  memory_remove: { id: "memory_remove", parallel: false, retryable: false },
};

export type PlannedTool = { callId: string; toolId: string; args: Record<string, unknown> };

export type ProgressUpdate = {
  callId: string;
  toolId: string;
  progress: number;
  detail: string;
  attempt?: number;
  retrying?: boolean;
  data?: unknown;
};

export type ExecutionResult<T> = { result: T; attempts: number };

export function dependencyLevels(calls: PlannedTool[]): PlannedTool[][] {
  const byTool = new Map<string, PlannedTool[]>();
  for (const call of calls) byTool.set(call.toolId, [...(byTool.get(call.toolId) || []), call]);
  const remaining = [...calls];
  const placed = new Set<string>();
  const levels: PlannedTool[][] = [];
  while (remaining.length) {
    const ready = remaining.filter((call) => {
      const requires = TOOL_REGISTRY[call.toolId]?.requires || [];
      return requires.every((dep) => !byTool.has(dep) || byTool.get(dep)!.every((candidate) => placed.has(candidate.callId)));
    });
    if (!ready.length) throw new Error(`Tool dependency cycle detected near: ${remaining.map((item) => item.toolId).join(", ")}`);
    const batch: PlannedTool[] = [];
    const serial: PlannedTool[] = [];
    for (const call of ready) {
      if (TOOL_REGISTRY[call.toolId]?.parallel === false) serial.push(call);
      else batch.push(call);
    }
    if (batch.length) levels.push(batch);
    if (serial.length) for (const call of serial) levels.push([call]);
    for (const call of [...batch, ...serial]) placed.add(call.callId);
    const ids = new Set([...batch, ...serial].map((call) => call.callId));
    for (let i = remaining.length - 1; i >= 0; i--) if (ids.has(remaining[i].callId)) remaining.splice(i, 1);
  }
  return levels;
}

export function shouldRetry(toolId: string, error: unknown, attempt: number): boolean {
  const config = TOOL_REGISTRY[toolId];
  if (!config?.retryable) return false;
  const max = config.maxRetries ?? 2;
  if (attempt >= max) return false;
  const message = String(error instanceof Error ? error.message : error).toLowerCase();
  return /timeout|timed out|network|fetch|429|5\d\d|temporar|econn|reset|busy/i.test(message);
}

export async function executeWithRetry<T>(
  toolId: string,
  execute: (attempt: number) => Promise<T>,
  onProgress?: (update: { progress: number; detail: string; attempt: number; retrying?: boolean }) => void,
): Promise<ExecutionResult<T>> {
  const maxRetries = TOOL_REGISTRY[toolId]?.maxRetries ?? 2;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    onProgress?.({ progress: attempt === 0 ? 8 : 18 + attempt * 8, detail: attempt === 0 ? "Starting" : `Retrying (attempt ${attempt + 1})`, attempt, retrying: attempt > 0 });
    try {
      const result = await execute(attempt);
      return { result, attempts: attempt + 1 };
    } catch (error) {
      if (!shouldRetry(toolId, error, attempt)) throw error;
      const delay = Math.min(1200 * 2 ** attempt, 4000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Tool ${toolId} failed after retries.`);
}

export function runnableAgentRole(role: string) {
  return ["explorer", "coder", "tester", "reviewer", "researcher"].includes(role);
}
