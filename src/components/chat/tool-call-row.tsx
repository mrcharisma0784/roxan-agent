import * as React from "react";
import { ChevronDown, ChevronUp, Copy, LoaderCircle, Plug } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { findTool } from "@/lib/tools";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/store/roxan";

function AnimatedToolLabel({ label, active }: { label: string; active: boolean }) {
  const [shown, setShown] = useState(active ? "" : label);
  const previousLabel = useRef(label);
  const didType = useRef(!active);

  useEffect(() => {
    if (!active) {
      setShown(label);
      previousLabel.current = label;
      return;
    }
    if (didType.current) {
      // Progress/details can change while a tool is running. Update the text in place;
      // never clear and re-type the whole heading.
      setShown(label);
      previousLabel.current = label;
      return;
    }
    didType.current = true;
    previousLabel.current = label;
    let index = 0;
    setShown("");
    const timer = window.setInterval(() => {
      index += 1;
      setShown(label.slice(0, index));
      if (index >= label.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [label, active]);

  return <span className={cn("min-w-0 truncate", active && "tool-row-shimmer")}>{shown}</span>;
}

export function ToolCallRow({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false);
  const tool = findTool(toolCall.toolId);
  const Icon = tool?.icon ?? Plug;
  const isActive = toolCall.status === "active";
  const isDone = toolCall.status === "done";
  const isError = toolCall.status === "error";
  const baseLabel = isDone ? tool?.done ?? toolCall.toolId : tool?.active ?? toolCall.toolId;
  const displayLabel = toolCall.toolId === "command_exec" ? "Bash" : baseLabel;
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) { startedAt.current = null; setElapsed(0); return; }
    if (startedAt.current === null) startedAt.current = Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - (startedAt.current || Date.now())) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isActive]);

  const liveDetail = isActive && toolCall.toolId === "reasoning"
    ? `for 00m ${String(elapsed).padStart(2, "0")}s`
    : toolCall.detail;
  const expandable = !isActive && (toolCall.input !== undefined || toolCall.output !== undefined);

  async function copyContent(value: unknown) {
    try { await navigator.clipboard.writeText(formatContent(value)); toast("Tool içeriği kopyalandı."); }
    catch { toast("İçerik kopyalanamadı."); }
  }

  return <div className="w-full min-w-0 overflow-hidden font-sans">
    <button type="button" className={cn("flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-subtle transition-colors hover:bg-bg-subtle", expandable ? "cursor-pointer" : "cursor-default", isActive && "bg-bg-subtle text-fg", isDone && "text-muted", isError && "text-danger")} onClick={() => expandable && setExpanded((value) => !value)} aria-expanded={expandable ? expanded : undefined} disabled={!expandable}>
      {isActive ? <LoaderCircle className="size-3.5 shrink-0 animate-spin text-accent" strokeWidth={1.75} /> : <Icon className="size-3.5 shrink-0" strokeWidth={1.75} />}
      <AnimatedToolLabel label={displayLabel} active={isActive} />
      {liveDetail ? <span className={cn("min-w-0 flex-1 truncate text-xs", isActive ? "text-muted" : "text-subtle")}>{liveDetail}</span> : null}{isActive && typeof toolCall.progress === "number" ? <span className="ml-auto h-1 w-12 shrink-0 overflow-hidden rounded-full bg-border"><span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.max(0, Math.min(100, toolCall.progress))}%` }} /></span> : null}
      {expandable ? (expanded ? <ChevronUp className="ml-auto size-3.5 shrink-0 text-subtle" strokeWidth={1.8} /> : <ChevronDown className="ml-auto size-3.5 shrink-0 text-subtle" strokeWidth={1.8} />) : null}
    </button>
    {expanded ? <div className="mt-1 mb-1.5 ml-2 w-[calc(100%-0.5rem)] max-w-full min-w-0 overflow-hidden rounded-xl bg-bg-subtle shadow-border">{toolCall.input !== undefined ? <ToolDetailBlock title="Ne yapıldı?" value={toolCall.input} onCopy={copyContent} toolId={toolCall.toolId} /> : null}{toolCall.output !== undefined ? <ToolDetailBlock title="Sonuç" value={toolCall.output} onCopy={copyContent} toolId={toolCall.toolId} /> : null}</div> : null}
  </div>;
}

function ToolDetailBlock({ title, value, onCopy, toolId }: { title: string; value: unknown; onCopy: (value: unknown) => void; toolId: string }) { return <div className="min-w-0 max-w-full border-t border-border first:border-t-0"><div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-muted uppercase"><span>{title}</span><button type="button" onClick={() => onCopy(value)} aria-label={`${title} içeriğini kopyala`} className="grid size-7 shrink-0 place-items-center rounded-lg text-muted hover:bg-bg-elevated hover:text-fg"><Copy className="size-3.5" strokeWidth={1.7} /></button></div><div className="max-h-72 max-w-full min-w-0 overflow-x-auto overflow-y-auto px-2.5 pb-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap text-fg">{friendlyContent(value, toolId)}</div></div>; }
function friendlyContent(value: unknown, toolId: string) { if (typeof value === "string") return value; if (!value || typeof value !== "object") return String(value ?? ""); const record = value as Record<string, unknown>; if (toolId === "web_search") { const rows = Array.isArray(record.results) ? record.results : record.data && typeof record.data === "object" && Array.isArray((record.data as Record<string, unknown>).results) ? (record.data as Record<string, unknown>).results as unknown[] : []; if (rows.length) return rows.map((item) => { const row = item as Record<string, unknown>; return `• ${String(row.title ?? row.name ?? row.url ?? "Sayfa")}${row.url ? `\n  ${String(row.url)}` : ""}`; }).join("\n"); } const keys = ["title", "name", "url", "query", "path", "command", "summary", "description", "status", "message"]; const lines = keys.filter((key) => record[key] !== undefined && record[key] !== null).map((key) => `${friendlyKey(key)}: ${String(record[key])}`); if (lines.length) return lines.join("\n"); const serialized = JSON.stringify(value, null, 2); return serialized && serialized !== "{}" ? serialized.slice(0, 24000) : "Tool tamamlandı."; }
function friendlyKey(key: string) { return ({ url: "Adres", query: "Arama", path: "Dosya", command: "Komut", title: "Başlık", status: "Durum", message: "Mesaj" } as Record<string, string>)[key] ?? key; }
function formatContent(value: unknown) { return typeof value === "string" ? value : JSON.stringify(value, null, 2) ?? String(value); }
