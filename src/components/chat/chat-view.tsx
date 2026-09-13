import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Composer } from "@/components/chat/composer";
import type { ComposerAttachment } from "@/components/chat/composer";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Button } from "@/components/ui/button";
import { streamChat } from "@/lib/chat-client";
import {
  hasFirecrawl,
  hasMemory,
  isConfigured,
  supportsReasoning,
  useRoxan,
} from "@/store/roxan";

export function ChatView({ buildMode = false, initialPrompt }: { buildMode?: boolean; initialPrompt?: string } = {}) {
  const navigate = useNavigate();
  const hydrated = useRoxan((state) => state.hydrated);
  const settings = useRoxan((state) => state.settings);
  const chatModelMode = useRoxan((state) => state.chatModelMode);
  const webSearchEnabled = useRoxan((state) => state.webSearchEnabled);
  const setWebSearchEnabled = useRoxan((state) => state.setWebSearchEnabled);
  const reasoningEnabled = useRoxan((state) => state.reasoningEnabled);
  const setReasoningEnabled = useRoxan((state) => state.setReasoningEnabled);
  const conversations = useRoxan((state) => state.conversations);
  const activeId = useRoxan((state) => state.activeConversationId);
  const streamingId = useRoxan((state) => state.streamingId);
  const abortRef = useRef<AbortController | null>(null);
  const buildStartedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [askQueue, setAskQueue] = useState<{ question: string; options: string[] }[]>([]);

  const conversation = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const messages = conversation?.messages ?? [];
  const configured = isConfigured(settings);
  const firecrawlReady = hasFirecrawl(settings);
  const memoryReady = hasMemory(settings);
  const reasoningSupported = supportsReasoning(chatModelMode === "flash" ? settings.modelProfiles.flashModel : settings.modelProfiles.defaultModel);
  const empty = messages.length === 0;

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!showJumpToLatest) bottomRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [messages, streamingId, showJumpToLatest]);

  function handleScroll() { const element = scrollRef.current; if (!element) return; setShowJumpToLatest(element.scrollHeight - element.scrollTop - element.clientHeight > 120); }
  function jumpToLatest() { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); setShowJumpToLatest(false); }

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (buildMode && initialPrompt && !buildStartedRef.current) { buildStartedRef.current = true; useRoxan.getState().newConversation(); setTimeout(() => void send(initialPrompt, [], true), 0); }
  }, [buildMode, initialPrompt]);

  useEffect(() => {
    if (buildMode) return;
    const handleBuildSubmit = (event: Event) => {
      const content = (event as CustomEvent<string>).detail;
      if (content) void send(content, [], true);
    };
    window.addEventListener("roxan:build-submit", handleBuildSubmit);
    return () => window.removeEventListener("roxan:build-submit", handleBuildSubmit);
  });

  async function send(content: string, attachments: ComposerAttachment[] = [], workspaceMode = buildMode) {
    if (content.trim().toLowerCase() === "/ask") { setAskQueue((queue) => [...queue, { question: "Projenin hedef kitlesi kim?", options: ["Bireysel kullanıcılar", "Küçük işletmeler", "Kurumsal ekipler"] }]); return; }
    if (!configured) {
      toast("Önce ayarlardan bağlantıyı tamamla.");
      void navigate({ to: "/settings" });
      return;
    }

    if (/(hatırla|unut|hafızaya|memory|mem0)/i.test(content) && !memoryReady) {
      toast("Memory bağlı değil. Ayarlardan Mem0 API Key ekle.");
      void navigate({ to: "/settings" });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const { assistantId } = useRoxan.getState().startTurn(content, attachments.map(({ name, kind, type, dataUrl }) => ({ name, kind, type, dataUrl })), replyTo || undefined, workspaceMode ? "build" : "chat");
    const snapshot = useRoxan.getState();
    const active = snapshot.conversations.find((item) => item.id === snapshot.activeConversationId);
    const history: { role: "user" | "assistant" | "system"; content: string | { type: "text" | "image_url"; text?: string; image_url?: { url: string } }[] }[] = (active?.messages ?? [])
      .filter((message) => message.id !== assistantId && (message.content.trim() || Boolean(message.attachments?.length)) && !message.error)
      .map((message) => { const isCurrentUser = message.role === "user" && message.id === active?.messages.filter((item) => item.role === "user").at(-1)?.id; const attachmentsText = message.attachments?.map((attachment) => `Ek dosya: ${attachment.name}`).join("\n") || ""; const priorImages = active?.messages.filter((item) => item.role === "user").flatMap((item) => item.attachments || []).filter((attachment) => attachment.kind === "image" && attachment.dataUrl).slice(-3) || []; const imageContext = isCurrentUser && !message.attachments?.length && priorImages.length ? priorImages : message.attachments || []; const content = isCurrentUser && imageContext.length ? [{ type: "text" as const, text: `${message.content || "Ekli görseli incele."}\n${attachmentsText}` }, ...imageContext.filter((attachment) => attachment.kind === "image" && attachment.dataUrl).map((attachment) => ({ type: "image_url" as const, image_url: { url: attachment.dataUrl! } }))] : message.content || attachmentsText; return { role: message.role, content }; });
    const currentUser = history[history.length - 1];
    if (currentUser && attachments.length > 0) {
      currentUser.content = [
        { type: "text", text: typeof currentUser.content === "string" && currentUser.content.trim() ? currentUser.content : "Ekli dosya ve görselleri incele." },
        ...attachments.filter((attachment) => attachment.kind === "image").map((attachment) => ({
          type: "image_url" as const,
          image_url: { url: attachment.dataUrl },
        })),
        ...attachments.filter((attachment) => attachment.kind === "file").map((attachment) => ({
          type: "text" as const,
          text: `Ekli dosya: ${attachment.name}\n${attachment.dataUrl}`,
        })),
      ];
    }

    try {
      await streamChat(
        {
          settings: { ...snapshot.settings, model: workspaceMode ? snapshot.settings.modelProfiles.agenticModel : chatModelMode === "flash" ? snapshot.settings.modelProfiles.flashModel : snapshot.settings.modelProfiles.defaultModel },
          messages: history,
          webSearchEnabled: snapshot.webSearchEnabled && hasFirecrawl(snapshot.settings),
          reasoningEnabled:
            snapshot.reasoningEnabled && supportsReasoning(workspaceMode ? snapshot.settings.modelProfiles.agenticModel : chatModelMode === "flash" ? snapshot.settings.modelProfiles.flashModel : snapshot.settings.modelProfiles.defaultModel),
          workspaceMode,
          chatModelMode,
          workspaceId: workspaceMode && typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default",
        },
        {
          onDelta: (delta) => useRoxan.getState().appendAssistant(assistantId, delta),
          onToolCall: (event) => {
            useRoxan.getState().pushToolCall(assistantId, {
              callId: event.callId,
              toolId: event.toolId,
              status: "active",
              detail: event.detail,
              input: event.data ?? event.detail,
            });
          },
          onToolResult: (event) => {
            useRoxan.getState().updateToolCall(assistantId, event.callId, {
              status: event.error ? "error" : "done",
              detail: event.detail,
              output: event.data ?? event.detail,
            });
          },
          onAsk: (event) => { setAskQueue((queue) => [...queue, { question: event.question, options: event.options || [] }]); },
        },
        controller.signal,
      );
      useRoxan.getState().finishTurn(assistantId);
    } catch (error) {
      if (controller.signal.aborted) {
        useRoxan.getState().finishTurn(assistantId);
        return;
      }
      const message = error instanceof Error ? error.message : "Yanıt alınamadı.";
      if (/failed to fetch|networkerror|network error|load failed/i.test(message)) {
        useRoxan.getState().finishTurn(assistantId);
        toast("Bağlantı kesildi; mesajını tekrar göndererek devam edebilirsin.");
        return;
      }
      useRoxan.getState().failTurn(assistantId, message);
    }
  }

  function stop() {
    abortRef.current?.abort();
    const id = useRoxan.getState().streamingId;
    if (id) useRoxan.getState().finishTurn(id);
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} onScroll={handleScroll} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {empty ? (
          <EmptyState configured={configured} ready={hydrated} />
        ) : (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6 sm:px-5">
            {messages
              .filter((message) => message.role !== "system")
              .map((message) => (
                <MessageBubble
                  key={message.id}
                  id={`message-${message.id}`}
                  message={message}
                  streaming={message.id === streamingId}
                  onReply={message.role === "assistant" ? () => setReplyTo({ id: message.id, content: message.content || message.error || "" }) : undefined}
                  onReplyClick={(id) => { document.getElementById(`message-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                />
              ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      {showJumpToLatest ? <Button type="button" variant="outline" size="icon" className="absolute bottom-44 left-1/2 z-10 size-10 -translate-x-1/2 rounded-full bg-bg-elevated shadow-border-hover" onClick={jumpToLatest} aria-label="En yeni mesaja git"><ArrowDown className="size-4" /></Button> : null}
      {askQueue.length ? <AskPanel item={askQueue[0]} onAnswer={(answer) => { setAskQueue((queue) => queue.slice(1)); void send(answer, [], buildMode); }} onSkip={() => setAskQueue((queue) => queue.slice(1))} position={askQueue.length} /> : null}
      <Composer
        disabled={!hydrated}
        streaming={Boolean(streamingId)}
        webSearchEnabled={webSearchEnabled && firecrawlReady}
        firecrawlReady={firecrawlReady}
        onToggleWebSearch={setWebSearchEnabled}
        memoryReady={memoryReady}
        onOpenSettings={() => void navigate({ to: "/settings" })}
        reasoningEnabled={reasoningEnabled}
        reasoningSupported={reasoningSupported}
        onToggleReasoning={setReasoningEnabled}
        onSend={send}
        onStop={stop}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </div>
  );
}

function AskPanel({ item, onAnswer, onSkip, position }: { item: { question: string; options: string[] }; onAnswer: (value: string) => void; onSkip: () => void; position: number }) { const [value, setValue] = useState(""); return <div className="absolute bottom-44 left-1/2 z-20 w-[min(92vw,36rem)] -translate-x-1/2 rounded-2xl bg-bg-elevated p-3 shadow-border-hover"><div className="mb-2 flex items-start gap-3"><span className="shrink-0 text-xs text-muted">{1} of {position}</span><p className="m-0 min-w-0 flex-1 text-sm leading-relaxed text-fg"><strong className="mr-1">Q:</strong>{item.question}</p></div>{item.options.length ? <div className="mb-2 flex flex-col gap-1.5">{item.options.map((option, index) => <button type="button" key={`${option}-${index}`} className="rounded-xl bg-bg-subtle px-3 py-2 text-left text-xs text-fg hover:bg-border" onClick={() => onAnswer(option)}>{index + 1}) {option}</button>)}</div> : null}<form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); if (value.trim()) { onAnswer(value.trim()); setValue(""); } }}><input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Kendi yanıtını yaz" className="min-w-0 flex-1 rounded-xl bg-bg-subtle px-3 py-2 text-sm text-fg outline-none" /><Button type="submit" size="sm">Gönder</Button><Button type="button" variant="outline" size="sm" onClick={onSkip}>Atla</Button></form></div>; }
function EmptyState({ configured, ready }: { configured: boolean; ready: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 text-center">
      <h1 className="rise-in font-display text-5xl tracking-tight text-fg italic sm:text-6xl">
        Roxan
      </h1>
      <p className="rise-in-delay mt-3 max-w-sm text-sm leading-relaxed text-muted">
        {ready && !configured ? (
          <>
            Bağlantı henüz kurulmadı.{" "}
            <Link to="/settings" className="text-fg underline decoration-border underline-offset-4">
              Ayarlardan
            </Link>{" "}
            Cloudflare Account ID, API Token ve modeli gir.
          </>
        ) : (
          "Ne üzerinde çalışalım?"
        )}
      </p>
    </div>
  );
}
