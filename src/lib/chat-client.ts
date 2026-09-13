import type { ChatMessage, RoxanSettings } from "@/store/roxan";

export type ChatPayload = {
  settings: RoxanSettings;
  messages: { role: ChatMessage["role"]; content: string | { type: "text" | "image_url"; text?: string; image_url?: { url: string } }[] }[];
  webSearchEnabled?: boolean;
  reasoningEnabled?: boolean;
  workspaceMode?: boolean;
  chatModelMode?: "default" | "flash";
  workspaceId?: string;
};

export type ToolCallEvent = {
  type: "tool_call";
  callId: string;
  toolId: string;
  detail?: string;
  data?: unknown;
};

export type ToolProgressEvent = { type: "tool_progress"; callId: string; toolId: string; detail?: string; progress?: number; data?: unknown };

export type ToolResultEvent = {
  type: "tool_result";
  callId: string;
  toolId: string;
  error?: boolean;
  detail?: string;
  data?: unknown;
};

export type AskEvent = { type: "ask"; question: string; options?: string[] };
type StreamEvent =
  | { type: "delta"; text: string }
  | ToolCallEvent
  | ToolResultEvent
  | ToolProgressEvent
  | AskEvent
  | { type: "error"; message: string }
  | { type: "done" };

function fallbackHttpMessage(status: number) {
  if (status === 401) return "Yetkisiz (401). API token geçersiz olabilir.";
  if (status === 403) return "Erişim reddedildi (403). Account ID / token izinlerini kontrol et.";
  if (status === 404) return "Bulunamadı (404). Model adı veya Account ID hatalı olabilir.";
  if (status === 429) return "Kota aşıldı (429). Biraz bekleyip tekrar dene.";
  if (status >= 500) return `Sunucu hatası (${status}).`;
  return `Yanıt alınamadı (${status}).`;
}

async function readErrorMessage(response: Response) {
  const raw = await response.text();
  if (!raw.trim()) return fallbackHttpMessage(response.status);
  // Cloudflare/Vercel can return a complete HTML error document (not JSON).
  // Never surface that document inside the assistant bubble.
  if (/<(!doctype|html|head|body)\b/i.test(raw)) {
    if (response.status === 521) {
      return "Sunucu erişilemiyor (521). Roxan eski Worker adresini kullanmıyor; Ayarlar'daki Account ID, API Token ve modeli kaydedip tekrar dene.";
    }
    return fallbackHttpMessage(response.status);
  }
  try {
    const data = JSON.parse(raw) as { message?: string; error?: string };
    if (data.message) return data.message;
    if (data.error) return data.error;
  } catch {
    // not json
  }
  const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 280);
  return `${fallbackHttpMessage(response.status)} ${snippet}`;
}

export async function streamChat(
  payload: ChatPayload,
  handlers: {
    onDelta: (text: string) => void;
    onToolCall?: (event: ToolCallEvent) => void;
    onToolResult?: (event: ToolResultEvent) => void;
    onToolProgress?: (event: ToolProgressEvent) => void;
    onAsk?: (event: AskEvent) => void;
  },
  signal?: AbortSignal,
) {
  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    const detail = error instanceof Error ? error.message : "ağ hatası";
    throw new Error(`Sohbet servisine bağlanılamadı. ${detail}`);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("Boş yanıt alındı. Proxy yanıt gövdesi döndürmedi.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawEvent = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      let event: StreamEvent;
      try {
        event = JSON.parse(data) as StreamEvent;
      } catch {
        continue;
      }
      sawEvent = true;
      if (event.type === "delta" && event.text) handlers.onDelta(event.text);
      if (event.type === "tool_call") handlers.onToolCall?.(event);
      if (event.type === "tool_result") handlers.onToolResult?.(event);
      if (event.type === "tool_progress") handlers.onToolProgress?.(event);
      if (event.type === "ask") handlers.onAsk?.(event);
      if (event.type === "error") throw new Error(event.message);
    }
  }

  if (!sawEvent) {
    throw new Error("Sunucu olay göndermeden kapandı. Model veya Account ID'yi kontrol et.");
  }
}
