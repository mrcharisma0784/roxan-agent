import { useEffect } from "react";
import { streamChat } from "@/lib/chat-client";
import { useRoxan } from "@/store/roxan";

export function BackgroundTaskRunner() {
  const hydrated = useRoxan((state) => state.hydrated);
  const tasks = useRoxan((state) => state.agentTasks);
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const run = async () => {
      const now = Date.now();
      const workspaceIds = [...new Set(tasks.map((task) => task.workspaceId || "default"))];
      for (const workspaceId of workspaceIds) {
        try {
          const response = await fetch(`/api/maintenance?workspaceId=${encodeURIComponent(workspaceId)}`);
          if (response.ok) {
            const data = await response.json() as { plans?: Array<{ id: string; prompt: string; intervalMinutes: number; enabled: boolean; lastRunAt?: string }> };
            for (const plan of data.plans || []) {
              if (!plan.enabled) continue;
              const last = plan.lastRunAt ? new Date(plan.lastRunAt).getTime() : 0;
              if (now - last < plan.intervalMinutes * 60_000) continue;
              await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", workspaceId, prompt: `[AUTONOMOUS MAINTENANCE] ${plan.prompt}`, runAt: new Date(now + 5000).toISOString() }) }).catch(() => undefined);
              await fetch("/api/maintenance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, planId: plan.id, lastRunAt: new Date(now).toISOString(), lastStatus: "ok", lastSummary: "Bakım işi planlandı." }) }).catch(() => undefined);
            }
          }
        } catch { /* maintenance polling is best-effort */ }
      }
      for (const task of tasks) {
        if (!task.enabled || new Date(task.runAt).getTime() > now) continue;
        if (sessionStorage.getItem(`roxan-task-${task.id}-${task.runAt}`)) continue;
        sessionStorage.setItem(`roxan-task-${task.id}-${task.runAt}`, "1");
        const store = useRoxan.getState();
        const settings = store.settings;
        if (!settings.accountId || !settings.apiToken) continue;
        const { assistantId } = store.startTurn(`Scheduled task: ${task.prompt}`, [], undefined, "build", task.workspaceId);
        const current = useRoxan.getState();
        const conversation = current.conversations.find((item) => item.id === current.activeConversationId);
        const history = (conversation?.messages || []).filter((m) => m.id !== assistantId).map((m) => ({ role: m.role, content: m.content }));
        try {
          await streamChat({ settings: { ...settings, model: settings.modelProfiles.agenticModel }, messages: history as never, webSearchEnabled: true, reasoningEnabled: true, workspaceMode: true, workspaceId: task.workspaceId, researchMode: false }, { onDelta: (delta) => useRoxan.getState().appendAssistant(assistantId, delta), onToolCall: (event) => useRoxan.getState().pushToolCall(assistantId, { callId: event.callId, toolId: event.toolId, status: "active", detail: event.detail, input: event.data, startedAt: Date.now(), progress: 0 }), onToolProgress: (event) => useRoxan.getState().updateToolCall(assistantId, event.callId, { detail: event.detail, progress: event.progress }), onToolResult: (event) => useRoxan.getState().updateToolCall(assistantId, event.callId, { status: event.error ? "error" : "done", detail: event.detail, output: event.data, progress: 100 }), });
          useRoxan.getState().finishTurn(assistantId);
        } catch (error) { useRoxan.getState().failTurn(assistantId, error instanceof Error ? error.message : String(error)); }
      }
    };
    void run();
    const timer = window.setInterval(() => void run(), 60_000);
    return () => window.clearInterval(timer);
  }, [hydrated, tasks]);
  return null;
}
