import { randomUUID } from "node:crypto";
import type { Personalization, RoxanSettings } from "@/store/roxan";
import { runTool, summarizeArgs, summarizeResult, TOOL_SCHEMAS, type ToolResult } from "@/lib/roxan-tools.server";

export type ChatPayload = {
  settings: RoxanSettings;
  messages: { role: "user" | "assistant" | "system"; content: string | { type: "text" | "image_url"; text?: string; image_url?: { url: string } }[] }[];
  webSearchEnabled: boolean;
  reasoningEnabled: boolean;
  workspaceMode?: boolean;
  chatModelMode?: "default" | "flash";
  workspaceId?: string;
};

type ChatRole = "user" | "assistant" | "system";
type Incoming = {
  settings?: Partial<RoxanSettings> & { personalization?: Partial<Personalization>; modelProfiles?: Partial<RoxanSettings["modelProfiles"]> };
  messages?: { role?: string; content?: string | { type?: string; text?: string; image_url?: { url?: string } }[] }[];
  webSearchEnabled?: boolean;
  reasoningEnabled?: boolean;
  workspaceMode?: boolean;
  chatModelMode?: "default" | "flash";
  workspaceId?: string;
};
type CfToolCall = { id?: string; type?: string; function?: { name?: string; arguments?: string } };
type CfMessage = { role: string; content: string; tool_calls?: CfToolCall[]; tool_call_id?: string };

const BASE_SYSTEM_PROMPT = `Sen Roxan'sın; kullanıcının diliyle net, doğru ve eyleme dönük yanıt ver.
Karar sırası: (1) Kullanıcının amacını ve elindeki girdileri belirle, (2) eksik zorunlu girdileri sor, (3) yalnızca gerçekten gerekliyse tek uygun tool'u seç, (4) tool sonucunu kontrol et, (5) sonucu kısa ve anlaşılır aktar.
Görsel analizi ayrı vision katmanında yapılır ve analiz metni sana bağlam olarak gelir; görsel hakkında göremiyorum deme.
Kullanıcı görsel veya dosya göndermeden bir dosya/görseli incelemeni isterse dosyayı iste. Normal sohbette kullanıcı yalnızca bir dosya adı/yolu verirse dosya sisteminden okumaya çalışma; yalnızca Build workspace modunda ve yol açıkça verildiğinde file_read kullan.
Dosya eki varsa ekin içeriğini doğrudan kullan; aynı dosyayı tekrar isteme. Tool hatası alırsan hatayı tekrarlamak yerine nedenini açıkla ve kullanıcıdan gereken eksik girdiyi iste.
Selamlaşma ve kısa sohbetlerde tool kullanma. Yazma, silme, taşıma ve komut çalıştırma tool'larını ancak kullanıcı açıkça istediğinde kullan. Web search yalnızca etkinse ve güncel/harici doğrulama gerekiyorsa kullan. Memory tool'larını yalnızca açık hafıza talebinde kullan. Build modunda selamlaşma ve kısa sohbetlerde hiçbir tool kullanma. Gerçek bir proje isteğinde sıralı fazları uygula: AGENT.md okunduktan sonra ayrı bir reasoning çağrısı, ardından ayrı bir planning çağrısı, ardından plan adımlarını tek tek uygula. Dosya veya klasör isteniyorsa mutlaka gerçek file_create, dir_create, file_edit veya command_exec çağrısı yap ve sonucu doğrula; kodu yalnızca cevapta göstermeyi tamamlanmış sayma. Kullanıcı tercihi veya eksik zorunlu bilgi varsa ask toolunu çağır; seçenekleri mümkünse tam üç hazır cevap olarak üret. Fazları aynı turda birleştirme.`;
const REASONING_MODEL_PATTERNS = [/deepseek-r1/i, /qwq/i, /qwen.*(think|reason)/i, /gpt-oss/i, /phi-4-reason/i];
const WRITE_TOOLS = new Set(["file_create", "file_edit", "file_delete", "file_move", "dir_create", "dir_delete", "dir_move", "command_exec", "memory_add", "memory_edit", "memory_remove"]);
const FILE_TOOLS = new Set(["file_read", "workspace_instructions_read", "explore", "dir_list"]);

function sse(obj: unknown) { return `data: ${JSON.stringify(obj)}\n\n`; }
function asRole(value: string | undefined): ChatRole | null { return value === "user" || value === "assistant" || value === "system" ? value : null; }
function buildSystemPrompt(personalization?: Personalization) { const bits: string[] = []; if (personalization?.nickname?.trim()) bits.push(`Kullanıcıya "${personalization.nickname.trim()}" diye hitap et.`); if (personalization?.preferences?.trim()) bits.push(`Tercihler: ${personalization.preferences.trim()}`); if (personalization?.speakingStyle?.trim()) bits.push(`Konuşma biçimi: ${personalization.speakingStyle.trim()}`); return bits.length ? `${BASE_SYSTEM_PROMPT}\n${bits.join(" ")}` : BASE_SYSTEM_PROMPT; }

export function parseChatRequest(input: unknown): ChatPayload {
  const body = (input ?? {}) as Incoming;
  const settings: RoxanSettings = {
    workerUrl: body.settings?.workerUrl?.trim() ?? "",
    accountId: body.settings?.accountId?.trim() ?? "",
    backupAccountId: body.settings?.backupAccountId?.trim() ?? "",
    backupApiToken: body.settings?.backupApiToken?.trim() ?? "",
    modelProfiles: {
      defaultModel: body.settings?.modelProfiles?.defaultModel?.trim() || body.settings?.model?.trim() || "@cf/openai/gpt-oss-120b",
      agenticModel: body.settings?.modelProfiles?.agenticModel?.trim() || "@cf/nvidia/nemotron-3-120b-a12b",
      flashModel: body.settings?.modelProfiles?.flashModel?.trim() || "@cf/zai-org/glm-4.7-flash",
      visionModel: body.settings?.modelProfiles?.visionModel?.trim() || "@cf/qwen/qwen3.8-27b",
    },
    apiToken: body.settings?.apiToken?.trim() ?? "",
    model: body.settings?.model?.trim() ?? "",
    visionAccountId: body.settings?.visionAccountId?.trim() ?? "",
    visionApiToken: body.settings?.visionApiToken?.trim() ?? "",
    visionModel: body.settings?.visionModel?.trim() ?? "",
    firecrawlApiKey: body.settings?.firecrawlApiKey?.trim() ?? "",
    mem0ApiKey: body.settings?.mem0ApiKey?.trim() ?? "",
    personalization: { nickname: body.settings?.personalization?.nickname?.trim() ?? "", preferences: body.settings?.personalization?.preferences?.trim() ?? "", speakingStyle: body.settings?.personalization?.speakingStyle?.trim() ?? "" },
  };
  const messages = (body.messages ?? []).map((message) => {
    const role = asRole(message.role);
    const content = typeof message.content === "string" ? message.content : Array.isArray(message.content) ? message.content.filter((part) => part.type === "text" || part.type === "image_url").map((part) => ({ type: part.type as "text" | "image_url", ...(part.text ? { text: part.text } : {}), ...(part.image_url?.url ? { image_url: { url: part.image_url.url } } : {}) })) : "";
    if (!role || (typeof content === "string" ? !content.trim() : content.length === 0)) return null;
    return { role, content };
  }).filter((message): message is ChatPayload["messages"][number] => message !== null);
  if (!settings.model) throw new Error("Model gerekli. Ayarlar'dan bir sohbet modeli gir.");
  if (!settings.accountId || !settings.apiToken) throw new Error("Account ID ve API Token gerekli. Ayarlar sayfasından sohbet bağlantısını kaydet.");
  if (messages.length === 0) throw new Error("Mesaj boş olamaz.");
  return { settings, messages, webSearchEnabled: body.webSearchEnabled === true, reasoningEnabled: body.reasoningEnabled === true && REASONING_MODEL_PATTERNS.some((pattern) => pattern.test(settings.model)), workspaceMode: body.workspaceMode === true, chatModelMode: body.chatModelMode === "flash" ? "flash" : "default", workspaceId: body.workspaceId?.trim() || "default" };
}

function chatUrl(accountId: string) { return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`; }
function runUrl(accountId: string, model: string) { return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURI(model)}`; }
function extractDelta(parsed: unknown): string { if (!parsed || typeof parsed !== "object") return ""; const record = parsed as Record<string, unknown>; const choices = record.choices; if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") { const choice = choices[0] as Record<string, unknown>; const message = choice.message; if (message && typeof message === "object") { const content = (message as Record<string, unknown>).content; if (typeof content === "string") return content; if (Array.isArray(content)) return content.map((part) => typeof part === "string" ? part : part && typeof part === "object" ? String((part as Record<string, unknown>).text || (part as Record<string, unknown>).content || "") : "").join(" ").trim(); } const delta = choice.delta; if (delta && typeof delta === "object" && typeof (delta as Record<string, unknown>).content === "string") return String((delta as Record<string, unknown>).content); if (typeof choice.text === "string") return choice.text; } if (typeof record.response === "string") return record.response;
  if (typeof record.output_text === "string") return record.output_text;
  if (typeof record.answer === "string") return record.answer; if (typeof record.caption === "string") return record.caption; const result = record.result; if (typeof result === "string") return result; if (result && typeof result === "object") { const resultRecord = result as Record<string, unknown>; if (typeof resultRecord.response === "string") return resultRecord.response; if (typeof resultRecord.answer === "string") return resultRecord.answer; if (typeof resultRecord.caption === "string") return resultRecord.caption; } return ""; }
function extractError(parsed: unknown, fallback: string) { if (!parsed || typeof parsed !== "object") return fallback; const record = parsed as Record<string, unknown>; if (typeof record.message === "string" && record.message) return record.message; const errors = record.errors; if (Array.isArray(errors) && errors[0] && typeof errors[0] === "object" && typeof (errors[0] as Record<string, unknown>).message === "string") return String((errors[0] as Record<string, unknown>).message); return fallback; }
function describeHttpError(status: number, json: unknown) {
  const record = json && typeof json === "object" ? json as Record<string, unknown> : null;
  const errors = Array.isArray(record?.errors) ? record.errors : [];
  const errorCode = errors[0] && typeof errors[0] === "object" ? Number((errors[0] as Record<string, unknown>).code) : NaN;
  if (errorCode === 10000 || /authentication error/i.test(extractError(json, ""))) {
    return "Cloudflare Authentication error (10000). API Token’da Account → Workers AI → Read izni olmalı; Global API Key değil API Token kullan, Account ID’yi de aynı Cloudflare hesabından kopyala.";
  }
  const extracted = extractError(json, "");
  return extracted || ({ 401: "API token geçersiz veya yetkisiz (401).", 403: "Hesabın bu modele erişim izni yok (403). Cloudflare AI model lisansını etkinleştirmen gerekebilir.", 404: "Account ID veya model bulunamadı (404).", 429: "Kota aşıldı (429)." }[status] || `İstek başarısız (${status}).`);
}
async function readJsonSafe(response: Response) { try { return await response.json(); } catch { return null; } }
function messageText(content: ChatPayload["messages"][number]["content"]) { return typeof content === "string" ? content : content.filter((part) => part.type === "text").map((part) => part.text || "").join(" "); }
function latestUserMessage(messages: ChatPayload["messages"]) { const message = [...messages].reverse().find((item) => item.role === "user"); return message ? messageText(message.content) : ""; }
function isCasualMessage(content: string) { return /^(selam|merhaba|sa|hey|hello|hi|günaydın|iyi akşamlar|iyi geceler)[!.?,\s]*$/i.test(content.trim()); }
function hasExplicitActionRequest(content: string) { return /(dosya|klasör|dizin|workspace|file|folder|directory|komut|command|terminal|script|oluştur|yaz|kaydet|oku|listele|sil|düzenle|değiştir|çalıştır|hafıza|hatırla|unut|memory|remember|forget|ara|search|ask|sor|seçenek|tercih)/i.test(content); }
function availableTools(messages: ChatPayload["messages"], webSearchEnabled: boolean, workspaceMode: boolean) { const latest = latestUserMessage(messages); if (!latest || isCasualMessage(latest)) return []; const explicitAction = hasExplicitActionRequest(latest); if (!explicitAction && !webSearchEnabled && !workspaceMode) return []; const actionContext = explicitAction || workspaceMode; return TOOL_SCHEMAS.filter((tool) => { const name = tool.function?.name || ""; if (name === "web_search") return webSearchEnabled; if (FILE_TOOLS.has(name) && !workspaceMode) return false; if (!actionContext) return false; return true; }); }
function decodeAttachedText(text: string) { return text.replace(/data:([^;,]+);base64,([A-Za-z0-9+/=]+)/g, (_, mime: string, encoded: string) => { if (!/^text\//i.test(mime) && !/json|javascript|xml|csv|yaml|markdown/i.test(mime)) return `[${mime} dosya eki alındı; binary içerik doğrudan metin olarak çözülemedi]`; try { return `\n[Dosya içeriği]\n${Buffer.from(encoded, "base64").toString("utf8").slice(0, 16000)}\n[/Dosya içeriği]`; } catch { return "[Dosya içeriği okunamadı]"; } }); }

async function callChat(payload: ChatPayload, messages: CfMessage[], tools: typeof TOOL_SCHEMAS) {
  const source = messages.map((message) => ({ ...message, content: decodeAttachedText(message.content) }));
  const body: Record<string, unknown> = { model: payload.settings.model, stream: false, max_tokens: 8192, ...(tools.length > 0 && payload.workspaceMode ? { tool_choice: "auto" } : {}), messages: [{ role: "system", content: buildSystemPrompt(payload.settings.personalization) }, ...source].slice(-25) };
  if (tools.length > 0) body.tools = tools;
  if (payload.reasoningEnabled) body.reasoning_effort = "medium";
  const request = (accountId: string, apiToken: string, requestBody = body) => fetch(chatUrl(accountId), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` }, body: JSON.stringify(requestBody) });
  const transient = (response: Response) => response.status >= 500 || response.status === 408 || response.status === 429;
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  let primary = await request(payload.settings.accountId, payload.settings.apiToken);
  if (!primary.ok && transient(primary)) { await wait(350); primary = await request(payload.settings.accountId, payload.settings.apiToken); }
  if (!primary.ok && primary.status >= 500 && tools.length > 0) { const safeBody = { ...body }; delete safeBody.tool_choice; primary = await request(payload.settings.accountId, payload.settings.apiToken, safeBody); }
  if (primary.ok || !payload.settings.backupAccountId || !payload.settings.backupApiToken) return primary;
  let backup = await request(payload.settings.backupAccountId, payload.settings.backupApiToken);
  if (!backup.ok && transient(backup)) { await wait(500); backup = await request(payload.settings.backupAccountId, payload.settings.backupApiToken); }
  return backup;
}
async function callVision(payload: ChatPayload, prompt: string, image: string) {
  const accountId = payload.settings.accountId;
  const token = payload.settings.apiToken;
  const model = payload.settings.modelProfiles.visionModel || "@cf/qwen/qwen3.8-27b";
  const input = { model, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: image } }] }], stream: false, max_tokens: 4096 };
  const request = (id: string, key: string) => fetch(chatUrl(id), { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(input) });
  let response = await request(accountId, token);
  if (!response.ok && payload.settings.backupAccountId && payload.settings.backupApiToken) response = await request(payload.settings.backupAccountId, payload.settings.backupApiToken);
  return { response, json: await readJsonSafe(response), model };
}
async function enrichVision(payload: ChatPayload, messages: ChatPayload["messages"]) {
  const target = [...messages].reverse().find((message) => message.role === "user" && Array.isArray(message.content) && message.content.some((part) => part.type === "image_url"));
  if (!target || typeof target.content === "string") return messages.map((message) => ({ role: message.role, content: typeof message.content === "string" ? message.content : messageText(message.content) })) as CfMessage[];
  const image = target.content.find((part) => part.type === "image_url")?.image_url?.url;
  if (!image) return messages.map((message) => ({ role: message.role, content: typeof message.content === "string" ? message.content : messageText(message.content) })) as CfMessage[];
  const vision = await callVision(payload, `${messageText(target.content) || "Bu görseli ayrıntılı ve doğru biçimde analiz et. Kullanıcının isteği için önemli nesneleri, metinleri, düzeni ve belirsizlikleri belirt."}`, image);
  if (!vision.response.ok) throw new Error(`Vision modeli görseli analiz edemedi (${vision.model}): ${describeHttpError(vision.response.status, vision.json)}`);
  const analysis = extractDelta(vision.json);
  if (!analysis) { const raw = vision.json && typeof vision.json === "object" ? JSON.stringify(vision.json).slice(0, 500) : "boş yanıt"; throw new Error(`Vision modeli görsel analizi döndürmedi. Model: ${vision.model}. Cloudflare response: ${raw}`); }
  return messages.map((message) => ({ role: message.role, content: message === target ? `${messageText(message.content)}\n\n[Görsel analizi]\n${analysis}` : typeof message.content === "string" ? message.content : messageText(message.content) })) as CfMessage[];
}

export async function handleChat(request: Request): Promise<Response> {
  let payload: ChatPayload;
  try { payload = parseChatRequest(await request.json()); } catch (error) { return Response.json({ message: error instanceof Error ? error.message : "Geçersiz istek." }, { status: 400 }); }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ async start(controller) { const send = (obj: unknown) => controller.enqueue(encoder.encode(sse(obj))); try {
    const directFile = payload.messages.some((message) => message.role === "user" && Array.isArray(message.content) && message.content.some((part) => part.type === "text" && /data:[^;]+;base64,/i.test(part.text || "")));
    const fileReadCallId = directFile ? `attachment-${randomUUID()}` : "";
    if (fileReadCallId) send({ type: "tool_call", callId: fileReadCallId, toolId: "file_read", detail: "Ekli dosya okunuyor", data: { source: "message attachment" } });
    let conversation = await enrichVision(payload, payload.messages);
    if (payload.workspaceMode) { const instructionCallId = `instructions-${randomUUID()}`; send({ type: "tool_call", callId: instructionCallId, toolId: "workspace_instructions_read", detail: "AGENT.md okunuyor", data: { path: "AGENT.md" } }); const instructions = await runTool("workspace_instructions_read", {}, { workspaceMode: true, workspaceId: payload.workspaceId }); send({ type: "tool_result", callId: instructionCallId, toolId: "workspace_instructions_read", error: !instructions.ok, detail: instructions.ok ? "AGENT.md okundu" : instructions.error, data: instructions }); if (instructions.ok && instructions.content) conversation = [{ role: "system", content: `Workspace talimatları:
${instructions.content}` }, ...conversation]; }
    if (fileReadCallId) await new Promise((resolve) => setTimeout(resolve, 450));
    if (fileReadCallId) send({ type: "tool_result", callId: fileReadCallId, toolId: "file_read", error: false, detail: "Ekli dosya okundu", data: { ok: true, message: "Dosya içeriği doğrudan modele aktarıldı." } });
    const allTools = availableTools(payload.messages, payload.webSearchEnabled, Boolean(payload.workspaceMode));
    const phaseTool = (name: string) => allTools.filter((tool) => tool.function?.name === name);
    for (let turn = 0; turn < 12; turn++) {
      const tools = payload.workspaceMode && !isCasualMessage(latestUserMessage(payload.messages)) ? (turn === 0 ? phaseTool("reasoning") : turn === 1 ? phaseTool("planning") : allTools) : allTools;
      const upstream = await callChat(payload, conversation, tools);
      const json = await readJsonSafe(upstream);
      if (!upstream.ok) { send({ type: "error", message: describeHttpError(upstream.status, json) }); controller.close(); return; }
      const msg = json && typeof json === "object" ? (json as { choices?: { message?: Record<string, unknown> }[] }).choices?.[0]?.message : undefined;
      if (!msg) { const fallback = extractDelta(json); if (fallback) { send({ type: "delta", text: fallback }); send({ type: "done" }); controller.close(); return; } send({ type: "error", message: extractError(json, "Model boş yanıt döndürdü.") }); controller.close(); return; }
      const toolCalls = Array.isArray(msg.tool_calls) ? msg.tool_calls as CfToolCall[] : [];
      const text = typeof msg.content === "string" ? msg.content : "";
      if (toolCalls.length === 0) { if (text) send({ type: "delta", text }); send({ type: "done" }); controller.close(); return; }
      conversation.push({ role: "assistant", content: text, tool_calls: toolCalls });
      const prepared = toolCalls.map((call) => { const callId = call.id || randomUUID(); const toolId = call.function?.name || "api_request"; let args: Record<string, unknown> = {}; try { args = JSON.parse(call.function?.arguments || "{}"); } catch { /* malformed args */ } return { callId, toolId, args, call }; });
      prepared.forEach(({ callId, toolId, args }) => send({ type: "tool_call", callId, toolId, detail: summarizeArgs(args), data: args }));
      const results = await Promise.all(prepared.map(async ({ toolId, args }) => { try { return await runTool(toolId, args, { firecrawlApiKey: payload.settings.firecrawlApiKey, mem0ApiKey: payload.settings.mem0ApiKey, workspaceMode: payload.workspaceMode, workspaceId: payload.workspaceId }); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) } as ToolResult; } }));
      for (let index = 0; index < prepared.length; index += 1) { const { callId, toolId } = prepared[index]; const result = results[index]; if (toolId === "ask" && result.ok) { const askData = result.data as { question?: string; options?: string } | undefined; const parsedOptions = askData?.options ? askData.options.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3) : []; const options = parsedOptions.length >= 3 ? parsedOptions : [...parsedOptions, "Varsayılan seçeneği kullan", "Daha sonra karar ver", "Özel bir tercih belirteceğim"].slice(0, 3); send({ type: "ask", question: askData?.question || "Bir tercih belirtir misin?", options }); send({ type: "tool_result", callId, toolId, error: false, detail: "Kullanıcı yanıtı bekleniyor", data: result }); send({ type: "done" }); controller.close(); return; } send({ type: "tool_result", callId, toolId, error: !result.ok, detail: summarizeResult(result), data: result }); conversation.push({ role: "tool", tool_call_id: callId, content: JSON.stringify(result) }); }
    }
    send({ type: "error", message: "Tool kullanım sınırına ulaşıldı; isteği daha küçük adımlara bölebilirsin." }); controller.close();
  } catch (error) { send({ type: "error", message: error instanceof Error ? error.message : "Beklenmeyen hata." }); controller.close(); } } });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function handlePersonalization(request: Request): Promise<Response> { const body = await request.json().catch(() => null) as { apiKey?: string; personalization?: Personalization } | null; const apiKey = body?.apiKey?.trim(); const personalization = body?.personalization || { nickname: "", preferences: "", speakingStyle: "" }; const values = Object.entries(personalization).filter(([, value]) => typeof value === "string" && value.trim()); if (!apiKey) return Response.json({ message: "Mem0 API Key gerekli." }, { status: 400 }); if (values.length === 0) return Response.json({ ok: true, skipped: true }); const result = await runTool("memory_add", { content: `Kullanıcı kişiselleştirme tercihleri:\n${values.map(([label, value]) => `${label}: ${String(value).trim()}`).join("\n")}` }, { mem0ApiKey: apiKey }); return result.ok ? Response.json({ ok: true }) : Response.json({ message: result.error || "Mem0 kaydı başarısız." }, { status: 502 }); }
export async function handleMemoryList(request: Request): Promise<Response> { const body = await request.json().catch(() => null) as { apiKey?: string } | null; if (!body?.apiKey?.trim()) return Response.json({ message: "Mem0 API Key gerekli." }, { status: 400 }); const result = await runTool("memory_recall", { query: "kullanıcı tercihleri ve kayıtlı hafıza", limit: 10 }, { mem0ApiKey: body.apiKey.trim() }); return result.ok ? Response.json({ memories: result.memories || result.data || [] }) : Response.json({ message: result.error || "Memory okunamadı." }, { status: 502 }); }
