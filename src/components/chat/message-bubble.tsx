import * as React from "react";
import { Fragment, type ReactNode } from "react";
import { Copy, Download, FileText, Image, Reply } from "lucide-react";
import { toast } from "sonner";
import { ToolCallList } from "@/components/chat/tool-call-list";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/store/roxan";

export function MessageBubble({ message, streaming, onReply, onReplyClick, id }: { message: ChatMessage; streaming?: boolean; onReply?: () => void; onReplyClick?: (id: string) => void; id?: string }) {
  const isUser = message.role === "user";
  const emptyStream = streaming && !message.content && !message.error && (!message.toolCalls || message.toolCalls.length === 0);
  const canActions = !isUser && Boolean(message.content || message.error) && !streaming;
  async function copyResponse() {
    const value = message.content || message.error || "";
    try { await navigator.clipboard.writeText(value); toast("Yanıt kopyalandı."); } catch { toast("Yanıt kopyalanamadı."); }
  }
  return <div id={id} className={cn("flex w-full min-w-0", isUser ? "flex-col items-end justify-end gap-1" : "flex-col items-start justify-start gap-1")}>
    <div className={cn("max-w-full min-w-0 overflow-hidden text-sm leading-relaxed text-fg sm:max-w-xl", isUser ? "self-end rounded-2xl rounded-br-md bg-bg-elevated px-4 py-2.5 shadow-border" : "flex flex-col gap-2 rounded-2xl rounded-bl-md bg-bg-elevated px-4 py-2.5 shadow-border")}>
      {message.attachments?.length ? <div className="mb-1 flex flex-wrap gap-1.5">{message.attachments.map((attachment) => <span key={`${attachment.name}-${attachment.kind}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-bg-subtle px-2 py-1 text-xs text-fg"><span className="text-muted">{attachment.kind === "image" ? <Image className="size-3.5" /> : <FileText className="size-3.5" />}</span><span className="max-w-40 truncate">{attachment.name}</span></span>)}</div> : null}
      {!isUser ? <ToolCallList toolCalls={message.toolCalls} /> : null}
      {!isUser ? message.toolCalls?.map((call) => {
        const data = call.output && typeof call.output === "object" ? call.output as Record<string, unknown> : null;
        const nested = data?.data && typeof data.data === "object" ? data.data as Record<string, unknown> : data;
        const url = typeof nested?.downloadUrl === "string" ? nested.downloadUrl : "";
        const filename = typeof nested?.filename === "string" ? nested.filename : "roxan-project.zip";
        return url ? <a key={`output-${call.callId}`} href={url} download={filename} className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle p-3 text-left hover:bg-bg-elevated"><span className="grid size-10 place-items-center rounded-lg bg-bg-elevated"><Download className="size-5 text-muted" /></span><span className="min-w-0"><strong className="block truncate text-sm text-fg">{filename}</strong><span className="text-xs text-muted">ZIP · İndirmek için dokun</span></span></a> : null;
      }) : null}
      {emptyStream ? <span className="flex h-6 items-center gap-1.5" aria-label="Yazıyor"><span className="typing-dot size-1.5 rounded-full bg-muted" /><span className="typing-dot size-1.5 rounded-full bg-muted" /><span className="typing-dot size-1.5 rounded-full bg-muted" /></span> : message.content || message.error ? <div className="min-w-0 break-words">{message.content ? <MarkdownText value={message.content} /> : null}{streaming && message.content ? <span className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-fg align-middle" /> : null}{message.error ? <span className={message.content ? "mt-1 block text-danger" : "text-danger"}>{message.error}</span> : null}</div> : null}
    </div>
    {isUser && message.replyTo ? <button type="button" className="mr-0 flex max-w-xl items-center gap-1.5 self-end border-r-2 border-border px-2 text-xs text-muted hover:text-fg" onClick={() => onReplyClick?.(message.replyTo!.id)}><Reply className="size-3 -scale-x-100" /><span className="truncate">Replied to Agent</span></button> : null}
    {canActions ? <div className="ml-2 flex items-center gap-1"><button type="button" className="grid size-7 place-items-center rounded-lg text-muted hover:bg-bg-subtle hover:text-fg" onClick={copyResponse} aria-label="Yanıtı kopyala"><Copy className="size-3.5" /></button><button type="button" className="grid size-7 place-items-center rounded-lg text-muted hover:bg-bg-subtle hover:text-fg" onClick={onReply} aria-label="Bu yanıta cevap ver"><Reply className="size-3.5" /></button></div> : null}
  </div>;
}

function MarkdownText({ value }: { value: string }) {
  const lines = value.replace(/\r\n?/g, "\n").split("\n");
  const output: ReactNode[] = [];
  let list: { ordered: boolean; text: string }[] = [];
  let code = false;
  let codeLines: string[] = [];
  let table: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    const ordered = list[0].ordered;
    output.push(ordered
      ? <ol key={`list-${output.length}`} className="my-2 list-decimal space-y-1 pl-5">{list.map((item, index) => <li key={index}><InlineText value={item.text} /></li>)}</ol>
      : <ul key={`list-${output.length}`} className="my-2 list-disc space-y-1 pl-5">{list.map((item, index) => <li key={index}><InlineText value={item.text} /></li>)}</ul>);
    list = [];
  };
  const flushTable = () => {
    if (table.length < 2) { table = []; return; }
    const rows = table.map(parseTableRow).filter((row) => row.length > 0);
    if (rows.length < 2) { table = []; return; }
    const header = rows[0];
    const body = rows.slice(1);
    output.push(<div key={`table-${output.length}`} className="my-3 w-full max-w-full overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-max border-collapse text-left text-xs"><thead className="bg-bg-subtle"><tr>{header.map((cell, i) => <th key={i} className="border-b border-border px-3 py-2 font-semibold text-fg">{cell}</th>)}</tr></thead><tbody>{body.map((row, r) => <tr key={r} className="odd:bg-bg-elevated even:bg-bg-subtle/40">{header.map((_, c) => <td key={c} className="border-b border-border px-3 py-2 align-top text-muted">{row[c] ?? ""}</td>)}</tr>)}</tbody></table></div>);
    table = [];
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim().startsWith("```")) {
      flushList(); flushTable();
      if (code) output.push(<pre key={`code-${index}`} className="my-2 max-w-full overflow-x-auto rounded-lg bg-bg-subtle p-3 text-xs leading-relaxed"><code>{codeLines.join("\n")}</code></pre>);
      codeLines = []; code = !code; continue;
    }
    if (code) { codeLines.push(line); continue; }
    if (isTableSeparator(lines[index + 1]) && isTableRow(line)) {
      flushList();
      table.push(line);
      table.push(lines[index + 1]);
      index += 1;
      while (index + 1 < lines.length && isTableRow(lines[index + 1])) { table.push(lines[index + 1]); index += 1; }
      flushTable();
      continue;
    }
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const bullet = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ordered || bullet) { flushTable(); list.push({ ordered: Boolean(ordered), text: (ordered || bullet)![1] }); continue; }
    flushList(); flushTable();
    const heading = line.match(/^\s*(#{1,3})\s+(.+)$/);
    if (heading) { const size = heading[1].length === 1 ? "text-lg" : heading[1].length === 2 ? "text-base" : "text-sm"; output.push(<h3 key={index} className={cn("mt-3 mb-1 font-semibold", size)}><InlineText value={heading[2]} /></h3>); }
    else if (/^>\s?/.test(line)) output.push(<blockquote key={index} className="my-2 border-l-2 border-border pl-3 text-muted"><InlineText value={line.replace(/^>\s?/, "")} /></blockquote>);
    else if (line.trim()) output.push(<p key={index} className="m-0 min-w-0"><InlineText value={line} /></p>);
    else output.push(<div key={index} className="h-2" />);
  }
  flushList(); flushTable();
  if (codeLines.length) output.push(<pre key="code-tail" className="my-2 max-w-full overflow-x-auto rounded-lg bg-bg-subtle p-3 text-xs"><code>{codeLines.join("\n")}</code></pre>);
  return <div className="min-w-0">{output}</div>;
}

function isTableRow(line?: string) { return Boolean(line && line.includes("|") && line.trim().startsWith("|") && line.trim().endsWith("|")); }
function isTableSeparator(line?: string) { return Boolean(line && /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*$/.test(line)); }
function parseTableRow(line: string) { return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()); }

function InlineText({ value }: { value: string }) {
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|https?:\/\/[^\s<]+|`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
  const pieces = value.split(pattern);
  const result: ReactNode[] = [];
  for (let index = 0; index < pieces.length; index += 1) {
    const piece = pieces[index]; if (!piece) continue;
    if (piece.startsWith("[") && pieces[index + 1] && pieces[index + 2]) { const href = pieces[index + 2]; result.push(<a key={index} href={href} target="_blank" rel="noreferrer" className="break-all text-accent underline underline-offset-2 hover:opacity-80">{pieces[index + 1]}</a>); index += 2; }
    else if (/^https?:\/\//.test(piece)) result.push(<a key={index} href={piece.replace(/[),.;!?]+$/, "")} target="_blank" rel="noreferrer" className="break-all text-accent underline underline-offset-2 hover:opacity-80">{piece}</a>);
    else if (piece.startsWith("`") && piece.endsWith("`")) result.push(<code key={index} className="rounded bg-bg-subtle px-1 py-0.5 text-[0.9em]">{piece.slice(1, -1)}</code>);
    else if ((piece.startsWith("**") && piece.endsWith("**")) || (piece.startsWith("__") && piece.endsWith("__"))) result.push(<strong key={index}>{piece.slice(2, -2)}</strong>);
    else if ((piece.startsWith("*") && piece.endsWith("*")) || (piece.startsWith("_") && piece.endsWith("_"))) result.push(<em key={index}>{piece.slice(1, -1)}</em>);
    else result.push(<Fragment key={index}>{piece}</Fragment>);
  }
  return <>{result}</>;
}
