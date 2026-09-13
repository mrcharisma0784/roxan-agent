import * as React from "react";
import { ChevronRight, FileText, Globe } from "lucide-react";
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
  const activeBuildConversation = conversations.find((conversation) => conversation.id === activeId && conversation.mode === "build");
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
  return <div className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><div className="build-hero mx-auto w-full max-w-2xl px-5 pb-8"><p className="mb-2.5 text-xs font-bold tracking-widest text-muted uppercase">Build modu · Workspace</p><h1 className="font-display text-5xl leading-none tracking-tight text-fg italic sm:text-6xl">Bir şeyler oluşturalım.</h1><p className="mt-3.5 mb-6 max-w-sm text-sm leading-relaxed text-muted">Roxan fikrini full-stack bir projeye dönüştürmeye hazır. Başladığında bu alan kapanır ve doğrudan Build sohbetine geçilir.</p><button type="button" onClick={() => setShowAgent((value) => !value)} className="mb-6 flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3 text-left shadow-border hover:bg-bg-subtle"><span className="grid size-9 place-items-center rounded-lg bg-bg-subtle"><FileText className="size-4" /></span><span className="flex-1"><strong className="block text-sm">AGENT.md</strong><small className="text-xs text-muted">Workspace yönlendirmeleri · varsayılan</small></span><ChevronRight className={cn("size-4 text-subtle transition-transform", showAgent && "rotate-90")} /></button>{showAgent ? <pre className="mb-6 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-bg-elevated p-4 text-xs leading-relaxed text-muted shadow-border">{BUILD_AGENT_MD}</pre> : null}<div className="grid gap-2.5">{PROJECT_TYPES.map((project) => { const Icon = project.icon; return <button type="button" key={project.title} className={cn("flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3.5 text-left text-fg shadow-border hover:bg-bg-subtle hover:shadow-border-hover", selected === project.title && "bg-bg-subtle shadow-border-hover")} onClick={() => setSelected(project.title)}><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bg-subtle"><Icon className="size-5" /></span><span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-sm font-semibold">{project.title}</strong><small className="text-xs text-muted">{project.text}</small></span><ChevronRight className="size-4 shrink-0 text-subtle" /></button>; })}</div></div></div><div className="build-composer-bar mx-auto mb-6 flex w-full max-w-2xl flex-col gap-2 px-4 sm:px-0">{selected ? <div className="flex items-center gap-2 px-1 text-xs text-muted"><span className="rounded-full bg-bg-subtle px-2.5 py-1.5 text-fg">{selected}</span></div> : null}<Composer disabled={!hydrated} onSend={onSubmitValue} onStop={() => undefined} /></div></div>;
}
