import * as React from "react";
import { CheckCircle2, ChevronRight, FileCode2, FileText, Globe, RotateCcw, Save } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { ChatView } from "@/components/chat/chat-view";
import { Composer } from "@/components/chat/composer";
import type { ComposerAttachment } from "@/components/chat/composer";
import { useRoxan } from "@/store/roxan";
import { BUILD_AGENT_MD } from "@/lib/build-agent-instructions";

const PROJECT_TYPES: { icon: typeof Globe; title: string; text: string }[] = [];

export function BuildView() {
  const hydrated = useRoxan((state) => state.hydrated);
  const conversations = useRoxan((state) => state.conversations);
  const activeId = useRoxan((state) => state.activeConversationId);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [startedPrompt, setStartedPrompt] = useState<string | null>(null);
  const [startedAttachments, setStartedAttachments] = useState<ComposerAttachment[]>([]);
  const [panel, setPanel] = useState<"changes" | "checkpoints" | null>(null);
  const [checkpoints, setCheckpoints] = useState<{ id: string; label: string; createdAt: string }[]>([]);
  const [busyCheckpoint, setBusyCheckpoint] = useState(false);
  const activeBuildConversation = conversations.find((conversation) => conversation.id === activeId && conversation.mode === "build");
  const changedFiles = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const message of activeBuildConversation?.messages || []) for (const tool of message.toolCalls || []) {
      const input = tool.input && typeof tool.input === "object" ? tool.input as Record<string, unknown> : {};
      const path = typeof input.path === "string" ? input.path : typeof input.from === "string" ? input.from : undefined;
      if (!path) continue;
      if (tool.toolId === "file_create" || tool.toolId === "file_edit") map.set(path, "changed");
      else if (tool.toolId === "file_delete") map.set(path, "deleted");
      else if (tool.toolId === "file_move") map.set(path, "moved");
    }
    return [...map.entries()];
  }, [activeBuildConversation]);
  async function loadCheckpoints() {
    const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default";
    const response = await fetch(`/api/project?workspaceId=${encodeURIComponent(workspaceId)}&checkpoints=1`);
    const data = await response.json().catch(() => ({})); setCheckpoints(Array.isArray(data.checkpoints) ? data.checkpoints : []);
  }
  async function createCheckpoint() {
    setBusyCheckpoint(true); try { const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default"; const response = await fetch(`/api/project?workspaceId=${encodeURIComponent(workspaceId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkpoint-create", label: "Manual checkpoint" }) }); if (response.ok) await loadCheckpoints(); } finally { setBusyCheckpoint(false); }
  }
  async function restoreCheckpoint(id: string) {
    setBusyCheckpoint(true); try { const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default"; await fetch(`/api/project?workspaceId=${encodeURIComponent(workspaceId)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "checkpoint-restore", checkpointId: id }) }); } finally { setBusyCheckpoint(false); }
  }
  function onSubmitValue(value: string, attachments: ComposerAttachment[] = []) {
    const idea = value.trim();
    const content = `${selected ? `${selected}: ` : ""}${idea}`.trim();
    if (!content && attachments.length === 0) return;
    if (typeof window !== "undefined") window.localStorage.setItem("roxan-build-workspace", content.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 64) || "project");
    setStartedAttachments(attachments);
    setStartedPrompt(content);
  }
  if (startedPrompt) return <ChatView buildMode initialPrompt={startedPrompt} initialAttachments={startedAttachments} />;
  if (hydrated && activeBuildConversation) return <ChatView buildMode />;
  return <div className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><div className="build-hero mx-auto w-full max-w-2xl px-5 pb-8"><p className="mb-2.5 text-xs font-bold tracking-widest text-muted uppercase">Build modu · Workspace</p><h1 className="font-display text-5xl leading-none tracking-tight text-fg italic sm:text-6xl">Bir şeyler oluşturalım.</h1><p className="mt-3.5 mb-6 max-w-sm text-sm leading-relaxed text-muted">Roxan fikrini full-stack bir projeye dönüştürmeye hazır. Başladığında bu alan kapanır ve doğrudan Build sohbetine geçilir.</p><button type="button" onClick={() => setShowAgent((value) => !value)} className="mb-6 flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3 text-left shadow-border hover:bg-bg-subtle"><span className="grid size-9 place-items-center rounded-lg bg-bg-subtle"><FileText className="size-4" /></span><span className="flex-1"><strong className="block text-sm">AGENT.md</strong><small className="text-xs text-muted">Workspace yönlendirmeleri · varsayılan</small></span><ChevronRight className={cn("size-4 text-subtle transition-transform", showAgent && "rotate-90")} /></button>{showAgent ? <pre className="mb-6 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-bg-elevated p-4 text-xs leading-relaxed text-muted shadow-border">{BUILD_AGENT_MD}</pre> : null}<div className="grid gap-2.5">{PROJECT_TYPES.map((project) => { const Icon = project.icon; return <button type="button" key={project.title} className={cn("flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3.5 text-left text-fg shadow-border hover:bg-bg-subtle hover:shadow-border-hover", selected === project.title && "bg-bg-subtle shadow-border-hover")} onClick={() => setSelected(project.title)}><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bg-subtle"><Icon className="size-5" /></span><span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-sm font-semibold">{project.title}</strong><small className="text-xs text-muted">{project.text}</small></span><ChevronRight className="size-4 shrink-0 text-subtle" /></button>; })}</div></div></div><div className="mx-auto flex w-full max-w-2xl gap-2 px-1 pb-2">
  <button type="button" className="flex items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1.5 text-xs text-muted shadow-border hover:bg-bg-subtle" onClick={() => setPanel(panel === "changes" ? null : "changes")}><FileCode2 className="size-3.5" /> Değişiklikler <span className="text-fg">{changedFiles.length}</span></button>
  <button type="button" className="flex items-center gap-1.5 rounded-full bg-bg-elevated px-3 py-1.5 text-xs text-muted shadow-border hover:bg-bg-subtle" onClick={async () => { const next = panel === "checkpoints" ? null : "checkpoints"; setPanel(next); if (next) await loadCheckpoints(); }}><Save className="size-3.5" /> Checkpoints</button>
</div>
{panel === "changes" ? <div className="mx-auto mb-2 w-full max-w-2xl rounded-2xl bg-bg-elevated p-3 shadow-border">{changedFiles.length ? <div className="flex flex-col gap-1">{changedFiles.map(([file, status]) => <div key={file} className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2 text-xs"><span className="truncate text-fg">{file}</span><span className="text-muted">{status}</span></div>)}</div> : <p className="m-0 text-xs text-muted">Bu oturumda dosya değişikliği kaydı yok.</p>}</div> : null}
{panel === "checkpoints" ? <div className="mx-auto mb-2 w-full max-w-2xl rounded-2xl bg-bg-elevated p-3 shadow-border"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-fg">Geri dönüş noktaları</span><button type="button" disabled={busyCheckpoint} onClick={() => void createCheckpoint()} className="rounded-lg bg-bg-subtle px-2.5 py-1.5 text-xs text-fg hover:bg-border">Yeni</button></div>{checkpoints.length ? <div className="flex flex-col gap-1">{checkpoints.map((cp) => <div key={cp.id} className="flex items-center gap-2 rounded-lg bg-bg-subtle px-3 py-2"><div className="min-w-0 flex-1"><div className="truncate text-xs text-fg">{cp.label}</div><div className="text-[10px] text-muted">{new Date(cp.createdAt).toLocaleString()}</div></div><button type="button" disabled={busyCheckpoint} onClick={() => void restoreCheckpoint(cp.id)} className="grid size-7 place-items-center rounded-lg text-muted hover:bg-border hover:text-fg" aria-label="Checkpointı geri yükle"><RotateCcw className="size-3.5" /></button></div>)}</div> : <p className="m-0 text-xs text-muted">Henüz checkpoint yok.</p>}</div> : null}
<div className="build-composer-bar composer-dock mx-auto mb-0 flex w-full flex-col gap-2 px-0">{selected ? <div className="flex items-center gap-2 px-1 text-xs text-muted"><span className="rounded-full bg-bg-subtle px-2.5 py-1.5 text-fg">{selected}</span></div> : null}<Composer disabled={!hydrated} onSend={onSubmitValue} onStop={() => undefined} /></div></div>;
}
