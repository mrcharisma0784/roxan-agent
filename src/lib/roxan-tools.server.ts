import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { extractZipFile, sanitizeArchiveName, writeZipFromDirectory } from "@/lib/archive.server";
import { BUILD_AGENT_MD, isLegacyGeneratedAgent } from "@/lib/build-agent-instructions";
import { workspaceCheckpointCreate } from "@/lib/workspace-checkpoints.server";
import { artifactCreate, artifactList } from "@/lib/artifacts.server";
import { deepResearch } from "@/lib/research.server";
import { deleteTask, listTasks, saveTask } from "@/lib/tasks.server";
import { addWorkspaceMember, getSharedWorkspace, removeWorkspaceMember } from "@/lib/shared-workspace.server";
import { BUILTIN_SKILLS, installSkill, listInstalledSkills, uninstallSkill } from "@/lib/skills-marketplace.server";
import { buildDelegationPlan } from "@/lib/multi-agent.server";
import { deleteMaintenancePlan, listMaintenancePlans, saveMaintenancePlan } from "@/lib/autonomous-maintenance.server";

const execAsync = promisify(exec);

const MEM0_BASE_URL = (process.env.MEM0_API_URL || "https://api.mem0.ai").replace(/\/$/, "");
const MEMORY_USER_ID = process.env.ROXAN_MEMORY_USER_ID || "roxan-local-user";

export type ToolCredentials = {
  firecrawlApiKey?: string;
  mem0ApiKey?: string;
  workspaceMode?: boolean;
  workspaceId?: string;
  attachments?: Record<string, string>;
  reportProgress?: (detail: string, data?: unknown) => void;
  visionAccountId?: string;
  visionApiToken?: string;
  visionModel?: string;
};

export type ToolResult = {
  ok: boolean;
  error?: string;
  message?: string;
  content?: string;
  stdout?: string;
  stderr?: string;
  entries?: { name: string; type: "dir" | "file" }[];
  results?: unknown;
  memories?: unknown;
  data?: unknown;
};

type JsonSchema = {
  type: string;
  properties?: Record<string, { type: string; description?: string; minimum?: number; maximum?: number }>;
  required?: string[];
};

function fn(
  name: string,
  description: string,
  parameters: JsonSchema,
): { type: "function"; function: { name: string; description: string; parameters: JsonSchema } } {
  return { type: "function", function: { name, description, parameters } };
}

export const TOOL_SCHEMAS = [
  fn("file_read", "roxan-workspace dizini içindeki bir dosyayı oku.", {
    type: "object",
    properties: { path: { type: "string", description: "Dosya yolu (workspace'e göre göreli)" } },
    required: ["path"],
  }),
  fn("file_create", "roxan-workspace dizini içinde yeni bir dosya oluştur veya üzerine yaz.", {
    type: "object",
    properties: {
      path: { type: "string" },
      content: { type: "string" },
    },
    required: ["path", "content"],
  }),
  fn("file_edit", "Var olan bir dosyada metin değiştirme (find & replace).", {
    type: "object",
    properties: {
      path: { type: "string" },
      find: { type: "string" },
      replace: { type: "string" },
    },
    required: ["path", "find", "replace"],
  }),
  fn("file_delete", "roxan-workspace içindeki bir dosyayı sil.", {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
  }),
  fn("file_move", "roxan-workspace içinde bir dosyayı taşı veya yeniden adlandır.", {
    type: "object",
    properties: {
      from: { type: "string" },
      to: { type: "string" },
    },
    required: ["from", "to"],
  }),
  fn("dir_list", "roxan-workspace içinde bir dizinin içeriğini listele.", {
    type: "object",
    properties: { path: { type: "string", description: "Varsayılan: kök dizin" } },
  }),
  fn("dir_create", "roxan-workspace içinde yeni bir dizin oluştur.", {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
  }),
  fn("dir_delete", "roxan-workspace içindeki bir dizini sil.", {
    type: "object",
    properties: { path: { type: "string" } },
    required: ["path"],
  }),
  fn("dir_move", "roxan-workspace içinde bir dizini taşı.", {
    type: "object",
    properties: {
      from: { type: "string" },
      to: { type: "string" },
    },
    required: ["from", "to"],
  }),
  fn("explore", "Workspace'i sığ bir derinlikle keşfet ve dosya ağacını döndür.", {
    type: "object",
    properties: {
      path: { type: "string", description: "Başlangıç dizini" },
      query: { type: "string", description: "Ada göre süz" },
    },
  }),
  fn(
    "workspace_instructions_read",
    "Workspace kökündeki AGENTS.md, README veya talimat dosyasını oku.",
    { type: "object", properties: {} },
  ),
  fn("command_exec", "roxan-workspace dizininde kısa bir kabuk komutu çalıştır (10sn zaman aşımı).", {
    type: "object",
    properties: { command: { type: "string" } },
    required: ["command"],
  }),
  fn("zip_create", "Workspace içindeki dosya veya klasörü ZIP olarak paketle; zip/apt-get/python3 gibi sistem komutlarını kullanma.", {
    type: "object",
    properties: { source: { type: "string", description: "Workspace'e göreli kaynak yolu; varsayılan proje kökü" }, filename: { type: "string", description: "ZIP dosya adı" } },
  }),
  fn("zip_extract", "Workspace içindeki ZIP arşivini güvenli biçimde aç.", {
    type: "object",
    properties: { archive: { type: "string", description: "ZIP dosyasının workspace'e göreli yolu" }, destination: { type: "string", description: "Açılacak hedef klasör; varsayılan arşiv adı" } },
    required: ["archive"],
  }),
  fn("workspace_memory_recall", "Bu workspace için yerel hafızadan ilgili kayıtları getir.", {
    type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 20 } }, required: ["query"],
  }),
  fn("workspace_memory_save", "Workspace için kalıcı bir bilgi/karar kaydet.", {
    type: "object", properties: { content: { type: "string" }, category: { type: "string" }, importance: { type: "integer", minimum: 1, maximum: 5 }, tags: { type: "string" } }, required: ["content"],
  }),
  fn("workspace_memory_list", "Workspace hafızasının kayıtlarını listele.", { type: "object", properties: {} }),
  fn("workspace_checkpoint_create", "Workspace için geri alınabilir bir checkpoint oluştur.", { type: "object", properties: { label: { type: "string" } } }),
  fn("workspace_checkpoint_list", "Workspace checkpoint kayıtlarını listele.", { type: "object", properties: {} }),
  fn("workspace_checkpoint_restore", "Belirtilen workspace checkpointını geri yükle.", { type: "object", properties: { checkpointId: { type: "string" } }, required: ["checkpointId"] }),
  fn("browser_vision", "Tarayıcı ekranını Vision modeliyle analiz et; DOM yerine görsel bağlam gerektiğinde kullan.", { type: "object", properties: { prompt: { type: "string", description: "Vision analiz talebi" } } }),
  fn("page_navigate", "Tarayıcı sayfasına git.", { type: "object", properties: { url: { type: "string" } }, required: ["url"] }),
  fn("element_click", "Tarayıcıdaki elementi tıkla.", { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }),
  fn("form_type", "Tarayıcı form alanına yaz.", { type: "object", properties: { selector: { type: "string" }, text: { type: "string" } }, required: ["selector", "text"] }),
  fn("element_hover", "Tarayıcı elementinin üzerine gel.", { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }),
  fn("page_scroll", "Tarayıcı sayfasını kaydır.", { type: "object", properties: { amount: { type: "integer" } }, required: ["amount"] }),
  fn("dom_inspect", "Tarayıcı DOM yapısını incele.", { type: "object", properties: { selector: { type: "string" } } }),
  fn("screenshot", "Tarayıcı ekran görüntüsü al.", { type: "object", properties: {} }),
  fn("browser_back", "Tarayıcıda önceki sayfaya dön.", { type: "object", properties: {} }),
  fn("browser_forward", "Tarayıcıda sonraki sayfaya ilerle.", { type: "object", properties: {} }),
  fn("browser_reload", "Mevcut tarayıcı sayfasını yenile.", { type: "object", properties: {} }),
  fn("browser_tab_open", "Yeni bir tarayıcı sekmesi aç.", { type: "object", properties: { url: { type: "string" } } }),
  fn("browser_tab_close", "Aktif veya belirtilen tarayıcı sekmesini kapat.", { type: "object", properties: { tabId: { type: "string" } } }),
  fn("browser_tab_switch", "Tarayıcı sekmesini değiştir.", { type: "object", properties: { tabId: { type: "string" } }, required: ["tabId"] }),
  fn("browser_tabs", "Açık tarayıcı sekmelerini listele.", { type: "object", properties: {} }),
  fn("image_view", "Workspace içindeki görseli inceleme için hazırla.", { type: "object", properties: { path: { type: "string" } }, required: ["path"] }),
  fn("planning", "İsteği uygulanabilir kısa adımlara ayır.", { type: "object", properties: { steps: { type: "string" } }, required: ["steps"] }),
  fn("reasoning", "Karar için kısa gerekçe ve varsayımları kaydet.", { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] }),
  fn("skills_load", "Bir workspace yeteneğini etkinleştir.", { type: "object", properties: { name: { type: "string" } }, required: ["name"] }),
  fn("skills_unload", "Bir workspace yeteneğini devre dışı bırak.", { type: "object", properties: { name: { type: "string" } }, required: ["name"] }),
  fn("api_request", "Yapılandırılmış harici API isteği hazırlamak için kullan.", { type: "object", properties: { url: { type: "string" }, method: { type: "string" } }, required: ["url"] }),
  fn("deploy", "Deploy öncesi yapılandırmayı kontrol et; kullanıcı açıkça istemeden yayınlama.", { type: "object", properties: { target: { type: "string" } }, required: ["target"] }),
  fn("project_archive", "Workspace projesini ZIP olarak paketle ve kullanıcıya indirilebilir çıktı ver; sistem zip komutu kullanma.", { type: "object", properties: { filename: { type: "string" } } }),
  fn("artifact_create", "Kod, metin, tablo veya yapılandırılmış bir çıktıyı sohbet içinde kalıcı Artifact olarak oluştur.", { type: "object", properties: { name: { type: "string" }, mime: { type: "string" }, content: { type: "string" } }, required: ["content"] }),
  fn("artifact_list", "Workspace Artifact çıktılarının listesini getir.", { type: "object", properties: {} }),
  fn("deep_research", "Bir konuyu çok kaynaklı araştır; güvenilir sonuçları, kaynakları ve kısa içerik özetlerini döndür.", { type: "object", properties: { query: { type: "string" }, limit: { type: "integer", minimum: 3, maximum: 8 } }, required: ["query"] }),
  fn("agent_task_create", "Workspace için planlanmış arka plan agent görevi oluştur.", { type: "object", properties: { prompt: { type: "string" }, runAt: { type: "string" }, repeatMinutes: { type: "integer", minimum: 60 } }, required: ["prompt", "runAt"] }),
  fn("agent_task_list", "Planlanmış agent görevlerini listele.", { type: "object", properties: {} }),
  fn("agent_task_delete", "Planlanmış agent görevini sil.", { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] }),
  fn("agent_delegate", "Görevi explorer, coder, tester, reviewer veya researcher rollerine bölerek çoklu agent planı oluştur.", { type: "object", properties: { goal: { type: "string" }, roles: { type: "string", description: "Roller virgülle ayrılır" } }, required: ["goal"] }),
  fn("agent_job_create", "Uzun süren bir Agent işi için dayanıklı job kaydı oluştur.", { type: "object", properties: { prompt: { type: "string" }, runAt: { type: "string" }, repeatMinutes: { type: "integer", minimum: 60 } }, required: ["prompt"] }),
  fn("agent_job_list", "Uzun süren Agent işlerini listele.", { type: "object", properties: {} }),
  fn("agent_job_cancel", "Uzun süren Agent işini iptal et.", { type: "object", properties: { taskId: { type: "string" } }, required: ["taskId"] }),
  fn("maintenance_plan_create", "Workspace için periyodik otonom bakım planı oluştur.", { type: "object", properties: { name: { type: "string" }, prompt: { type: "string" }, intervalMinutes: { type: "integer", minimum: 60 } }, required: ["prompt"] }),
  fn("maintenance_plan_list", "Workspace otonom bakım planlarını listele.", { type: "object", properties: {} }),
  fn("maintenance_plan_delete", "Workspace otonom bakım planını sil.", { type: "object", properties: { planId: { type: "string" } }, required: ["planId"] }),
  fn("skill_catalog", "Yerleşik kurulabilir Agent skill kataloğunu listele.", { type: "object", properties: {} }),
  fn("skill_install", "Bir Agent skill paketini workspace'e yükle ve etkinleştir.", { type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
  fn("skill_uninstall", "Bir Agent skill paketini workspace'ten kaldır.", { type: "object", properties: { id: { type: "string" } }, required: ["id"] }),
  fn("workspace_members", "Paylaşımlı workspace üyelerini listele.", { type: "object", properties: {} }),
  fn("workspace_member_add", "Paylaşımlı workspace'e bir üye ekle.", { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, role: { type: "string" } }, required: ["name"] }),
  fn("workspace_member_remove", "Paylaşımlı workspace üyesini kaldır.", { type: "object", properties: { memberId: { type: "string" } }, required: ["memberId"] }),
  fn(
    "web_search",
    "Firecrawl ile web'de ara. Yalnızca güncel, harici veya kesin bilinmeyen bilgileri doğrulamak için kullan.",
    {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
  ),
  fn("ask", "Kullanıcıdan eksik bir bilgiyi form ile sor. question alanına yalnızca soru cümlesini yaz; seçenekleri soru metnine ekleme. options alanına en fazla üç kısa seçeneği || ile ayırarak yaz.", { type: "object", properties: { question: { type: "string", description: "Yalnızca soru cümlesi; seçenekleri buraya yazma." }, options: { type: "string", description: "En fazla üç seçenek; yalnızca seçenek etiketlerini || ile ayır." } }, required: ["question"] }),
  fn("memory_add", "Kullanıcı açıkça hatırlamamı istediğinde bilgiyi Mem0 hafızasına kaydet.", {
    type: "object",
    properties: {
      content: { type: "string", description: "Hatırlanacak bilgi veya kullanıcı tercihi" },
    },
    required: ["content"],
  }),
  fn("memory_recall", "Kullanıcı hafızada arama istediğinde Mem0'dan ilgili kayıtları getir.", {
    type: "object",
    properties: {
      query: { type: "string", description: "Hafızada aranacak konu" },
      limit: { type: "integer", minimum: 1, maximum: 10 },
    },
    required: ["query"],
  }),
  fn("memory_edit", "Kullanıcının açıkça istediği Mem0 hafıza kaydını güncelle.", {
    type: "object",
    properties: {
      memory_id: { type: "string" },
      text: { type: "string" },
    },
    required: ["memory_id", "text"],
  }),
  fn("memory_remove", "Kullanıcının açıkça unutmamı istediği Mem0 hafıza kaydını sil.", {
    type: "object",
    properties: { memory_id: { type: "string" } },
    required: ["memory_id"],
  }),
];

const resolvedWorkdirs = new Map<string, string>();

async function getWorkdir(workspaceMode = false, workspaceId = "default") {
  const safeId = workspaceId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "default";
  const cacheKey = `${workspaceMode}:${safeId}`;
  const cached = resolvedWorkdirs.get(cacheKey);
  if (cached) return cached;
  const workspaceRoot = process.env.ROXAN_WORKSPACES_ROOT || path.join(process.env.TMPDIR || process.env.TMP || "/tmp", "roxan-workspaces");
  const candidates = (workspaceMode ? [path.join(workspaceRoot, safeId), process.env.ROXAN_WORKDIR, path.join(process.cwd(), "workspaces", safeId)] : [process.env.HOME, "/tmp"]).filter(
    (value): value is string => Boolean(value),
  );

  for (const dir of candidates) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const probe = path.join(dir, ".roxan-write-test");
      await fs.writeFile(probe, "ok");
      await fs.rm(probe, { force: true });
      if (workspaceMode) { const agent = path.join(dir, "AGENT.md"); const existing = await fs.readFile(agent, "utf8").catch(() => ""); if (!existing || isLegacyGeneratedAgent(existing)) await fs.writeFile(agent, BUILD_AGENT_MD, "utf8"); }
      resolvedWorkdirs.set(cacheKey, dir);
      return dir;
    } catch {
      // try next
    }
  }
  throw new Error("Çalışma dizini oluşturulamadı. Ortam yazılabilir bir klasör sunmuyor.");
}

function resolveSafe(workdir: string, relPath: string) {
  const target = path.resolve(workdir, relPath || ".");
  const root = path.resolve(workdir);
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw new Error("Çalışma dizini dışına çıkılamaz.");
  }
  return target;
}

export async function readResponseBody(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const record = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    const detail =
      record?.detail || record?.message || record?.error || `İstek başarısız (${response.status}).`;
    throw new Error(String(detail));
  }
  return data;
}

async function mem0Request(apiKey: string | undefined, endpoint: string, options: RequestInit = {}) {
  if (!apiKey) {
    return { ok: false, error: "Mem0 API anahtarı yapılandırılmamış. Ayarlar'dan Mem0 API Key ekle." };
  }

  try {
    const response = await fetch(`${MEM0_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Token ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    return { ok: true, data: await readResponseBody(response) };
  } catch (error) {
    return { ok: false, error: String(error instanceof Error ? error.message : error) };
  }
}

async function walk(dir: string, depth: number, query: string, acc: { name: string; type: "dir" | "file" }[]) {
  if (depth < 0 || acc.length > 80) return;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (acc.length > 80) break;
    if (query && !entry.name.toLowerCase().includes(query.toLowerCase())) {
      if (entry.isDirectory()) {
        await walk(path.join(dir, entry.name), depth - 1, query, acc);
      }
      continue;
    }
    acc.push({ name: path.relative(dir, path.join(dir, entry.name)) || entry.name, type: entry.isDirectory() ? "dir" : "file" });
    if (entry.isDirectory()) {
      await walk(path.join(dir, entry.name), depth - 1, query, acc);
    }
  }
}

type BrowserTab = { id: string; page: import("playwright").Page; title: string; url: string };
type BrowserSessionState = { browser: import("playwright").Browser; tabs: Map<string, BrowserTab>; activeTabId: string };
const browserSessions = new Map<string, BrowserSessionState>();
async function browserSession(sessionKey = "default") {
  const existing = browserSessions.get(sessionKey);
  if (existing) return existing;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const tabId = randomUUID().slice(0, 8);
  const session: BrowserSessionState = { browser, tabs: new Map([[tabId, { id: tabId, page, title: "Yeni sekme", url: "about:blank" }]]), activeTabId: tabId };
  browserSessions.set(sessionKey, session);
  return session;
}
function activeBrowserTab(session: BrowserSessionState) {
  return session.tabs.get(session.activeTabId)!;
}
async function syncTab(tab: BrowserTab) {
  tab.url = tab.page.url();
  try { tab.title = await tab.page.title(); } catch { tab.title = tab.url; }
}

async function workspaceCheckpointRoot(workdir: string) {
  const root = path.join(workdir, ".roxan", "checkpoints");
  await fs.mkdir(root, { recursive: true });
  return root;
}
async function copyWorkspaceSnapshot(workdir: string, snapshot: string) {
  await fs.rm(snapshot, { recursive: true, force: true });
  await fs.mkdir(snapshot, { recursive: true });
  const entries = await fs.readdir(workdir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".roxan" || entry.name === "output" || entry.name === "node_modules" || entry.name === ".git") continue;
    await fs.cp(path.join(workdir, entry.name), path.join(snapshot, entry.name), { recursive: true, force: true });
  }
}
async function restoreWorkspaceSnapshot(workdir: string, snapshot: string) {
  const current = await fs.readdir(workdir, { withFileTypes: true });
  for (const entry of current) {
    if (entry.name === ".roxan" || entry.name === "output" || entry.name === "node_modules" || entry.name === ".git") continue;
    await fs.rm(path.join(workdir, entry.name), { recursive: true, force: true });
  }
  const entries = await fs.readdir(snapshot, { withFileTypes: true });
  for (const entry of entries) await fs.cp(path.join(snapshot, entry.name), path.join(workdir, entry.name), { recursive: true, force: true });
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  credentials: ToolCredentials = {},
): Promise<ToolResult> {
  const workdir = await getWorkdir(Boolean(credentials.workspaceMode), credentials.workspaceId);
  const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
  credentials.reportProgress?.(summarizeArgs(args) ? `${summarizeArgs(args)}` : "Starting");
  const mutatingTool = new Set(["file_create", "file_edit", "file_delete", "file_move", "dir_create", "dir_delete", "dir_move", "command_exec"]);
  if (Boolean(credentials.workspaceMode) && mutatingTool.has(name)) {
    try { await workspaceCheckpointCreate(workdir, `Auto before ${name}`); credentials.reportProgress?.("Safety checkpoint created", { stage: "checkpoint" }); } catch { /* checkpoint failure must not hide the requested operation */ }
  }

  switch (name) {
    case "file_read": {
      const p = resolveSafe(workdir, asString(args.path));
      try {
        const content = await fs.readFile(p, "utf-8");
        return { ok: true, content: content.slice(0, 12000) };
      } catch (error) {
        const requested = asString(args.path).replaceAll("\\", "/").replace(/^\/+/, "");
        const attachment = credentials.attachments?.[requested] ?? credentials.attachments?.[path.basename(requested)];
        if (attachment !== undefined) return { ok: true, content: attachment.slice(0, 16000), message: `Ekli dosya okundu: ${requested}` };
        const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "";
        return { ok: false, error: code === "ENOENT" ? `Dosya bulunamadı: ${asString(args.path)}` : String(error instanceof Error ? error.message : error) };
      }
    }
    case "file_create": {
      const p = resolveSafe(workdir, asString(args.path));
      await fs.mkdir(path.dirname(p), { recursive: true });
      await fs.writeFile(p, asString(args.content), "utf-8");
      return { ok: true, message: `Yazıldı: ${asString(args.path)}` };
    }
    case "file_edit": {
      const p = resolveSafe(workdir, asString(args.path));
      const content = await fs.readFile(p, "utf-8");
      const find = asString(args.find);
      if (!content.includes(find)) {
        return { ok: false, error: "Aranan metin bulunamadı." };
      }
      await fs.writeFile(p, content.replace(find, asString(args.replace)), "utf-8");
      return { ok: true, message: `Güncellendi: ${asString(args.path)}` };
    }
    case "file_delete": {
      const p = resolveSafe(workdir, asString(args.path));
      await fs.rm(p, { force: true });
      return { ok: true, message: `Silindi: ${asString(args.path)}` };
    }
    case "file_move": {
      const from = resolveSafe(workdir, asString(args.from));
      const to = resolveSafe(workdir, asString(args.to));
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.rename(from, to);
      return { ok: true, message: `Taşındı: ${asString(args.from)} → ${asString(args.to)}` };
    }
    case "dir_list": {
      const p = resolveSafe(workdir, asString(args.path, "."));
      const entries = await fs.readdir(p, { withFileTypes: true });
      return {
        ok: true,
        entries: entries.map((entry) => ({
          name: entry.name,
          type: entry.isDirectory() ? "dir" : "file",
        })),
      };
    }
    case "dir_create": {
      const p = resolveSafe(workdir, asString(args.path));
      await fs.mkdir(p, { recursive: true });
      return { ok: true, message: `Oluşturuldu: ${asString(args.path)}` };
    }
    case "dir_delete": {
      const p = resolveSafe(workdir, asString(args.path));
      await fs.rm(p, { recursive: true, force: true });
      return { ok: true, message: `Silindi: ${asString(args.path)}` };
    }
    case "dir_move": {
      const from = resolveSafe(workdir, asString(args.from));
      const to = resolveSafe(workdir, asString(args.to));
      await fs.mkdir(path.dirname(to), { recursive: true });
      await fs.rename(from, to);
      return { ok: true, message: `Taşındı: ${asString(args.from)} → ${asString(args.to)}` };
    }
    case "explore": {
      credentials.reportProgress?.("Scanning workspace");
      const p = resolveSafe(workdir, asString(args.path, "."));
      const entries: { name: string; type: "dir" | "file" }[] = [];
      await walk(p, 2, asString(args.query), entries);
      return { ok: true, entries };
    }
    case "workspace_instructions_read": {
      const names = ["AGENT.md", "AGENTS.md", "README.md", "INSTRUCTIONS.md"];
      for (const name of names) {
        const candidate = path.join(workdir, name);
        try {
          const content = await fs.readFile(candidate, "utf-8");
          return { ok: true, content: content.slice(0, 8000), message: name };
        } catch {
          // next
        }
      }
      return { ok: false, error: "Workspace'te AGENTS.md / README.md bulunamadı." };
    }
    case "command_exec": {
      credentials.reportProgress?.("Command started");
      try {
        const { stdout, stderr } = await execAsync(asString(args.command), {
          cwd: workdir,
          timeout: 30_000,
          maxBuffer: 8 * 1024 * 1024,
        });
        return { ok: true, stdout: stdout.length > 12000 ? `${stdout.slice(0, 12000)}\n… çıktı kısaltıldı (${stdout.length} karakter).` : stdout, stderr: stderr.slice(0, 4000) };
      } catch (error) {
        const err = error as Error & { stdout?: string; stderr?: string };
        return {
          ok: false,
          error: String(err.message || err).replace(/stdout maxBuffer length exceeded/i, "Komut çıktısı çok büyük; sonuç kısaltıldı.").slice(0, 2000),
          stdout: err.stdout ? `${err.stdout.slice(0, 12000)}${err.stdout.length > 12000 ? "\n… çıktı kısaltıldı." : ""}` : undefined,
          stderr: err.stderr?.slice(0, 4000),
        };
      }
    }
    case "zip_create": {
      credentials.reportProgress?.("Collecting files for archive");
      const source = asString(args.source, ".");
      const sourcePath = resolveSafe(workdir, source);
      const stat = await fs.stat(sourcePath);
      const filename = sanitizeArchiveName(asString(args.filename, path.basename(sourcePath) || "roxan-project"));
      const outputDir = path.join(workdir, "output");
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, filename);
      if (stat.isDirectory()) await writeZipFromDirectory(sourcePath, outputPath);
      else await fs.writeFile(outputPath, new Uint8Array(await fs.readFile(sourcePath)));
      return { ok: true, message: `ZIP hazır: ${filename}`, data: { filename, outputPath: `output/${filename}` } };
    }
    case "zip_extract": {
      const archive = asString(args.archive);
      const archivePath = resolveSafe(workdir, archive);
      const destination = resolveSafe(workdir, asString(args.destination, path.basename(archive).replace(/\.zip$/i, "") || "extracted"));
      const count = await extractZipFile(archivePath, destination);
      return { ok: true, message: `${count} dosya açıldı.`, data: { archive, destination: path.relative(workdir, destination), count } };
    }
    case "ask": { return { ok: true, data: { question: asString(args.question, "Bu işlem için hangi bilgiyi tercih edersin?"), options: asString(args.options) }, message: "Kullanıcı yanıtı bekleniyor." }; }
    case "workspace_memory_recall": {
      const memoryDir = path.join(workdir, ".roxan");
      const memoryPath = path.join(memoryDir, "workspace-memory.json");
      try {
        const raw = await fs.readFile(memoryPath, "utf8");
        const records = JSON.parse(raw) as { id: string; content: string; category?: string; importance?: number; tags?: string[]; createdAt: string; updatedAt?: string }[];
        const q = asString(args.query).trim().toLowerCase();
        const limit = Math.min(Math.max(Number(args.limit) || 8, 1), 20);
        const tokens = q.split(/\s+/).filter(Boolean);
        const matches = records.map((r) => ({ r, score: !q ? 0 : tokens.reduce((score, token) => score + (`${r.content} ${r.category || ""} ${(r.tags || []).join(" ")}`.toLowerCase().includes(token) ? 1 : 0), 0) + (r.importance || 0) * 0.05 })).filter((x) => !q || x.score > 0).sort((a, b) => b.score - a.score || String(b.r.createdAt).localeCompare(String(a.r.createdAt))).slice(0, limit).map((x) => x.r);
        credentials.reportProgress?.(`Found ${matches.length} memory ${matches.length === 1 ? "entry" : "entries"}`, { count: matches.length });
        return { ok: true, memories: matches };
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? String((error as { code?: unknown }).code) : "";
        if (code === "ENOENT") return { ok: true, memories: [] };
        return { ok: false, error: String(error instanceof Error ? error.message : error) };
      }
    }
    case "workspace_memory_save": {
      const content = asString(args.content).trim();
      if (!content) return { ok: false, error: "Kaydedilecek içerik boş." };
      const memoryDir = path.join(workdir, ".roxan");
      const memoryPath = path.join(memoryDir, "workspace-memory.json");
      await fs.mkdir(memoryDir, { recursive: true });
      let records: { id: string; content: string; category?: string; createdAt: string }[] = [];
      try { records = JSON.parse(await fs.readFile(memoryPath, "utf8")); } catch { /* first record */ }
      const duplicate = records.find((r) => r.content.trim().toLowerCase() === content.toLowerCase());
      if (duplicate) return { ok: true, message: "Bu bilgi workspace hafızasında zaten kayıtlı.", data: duplicate };
      const now = new Date().toISOString(); const record = { id: randomUUID(), content, category: asString(args.category, "general"), importance: Math.min(5, Math.max(1, Number(args.importance) || 3)), tags: asString(args.tags).split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8), createdAt: now, updatedAt: now };
      records.push(record);
      if (records.length > 200) records = records.slice(-200);
      await fs.writeFile(memoryPath, JSON.stringify(records, null, 2), "utf8");
      credentials.reportProgress?.("Memory saved", { category: record.category });
      return { ok: true, message: "Workspace hafızasına kaydedildi.", data: record };
    }
    case "workspace_memory_list": {
      const memoryPath = path.join(workdir, ".roxan", "workspace-memory.json");
      try { const records = JSON.parse(await fs.readFile(memoryPath, "utf8")); return { ok: true, memories: records.slice(-100).reverse() }; }
      catch { return { ok: true, memories: [] }; }
    }
    case "workspace_checkpoint_create": { const root = await workspaceCheckpointRoot(workdir); const id = `${Date.now()}-${randomUUID().slice(0, 8)}`; const snapshot = path.join(root, id); await copyWorkspaceSnapshot(workdir, snapshot); const meta = { id, label: asString(args.label, "Checkpoint"), createdAt: new Date().toISOString() }; await fs.writeFile(path.join(snapshot, "checkpoint.json"), JSON.stringify(meta), "utf8"); credentials.reportProgress?.("Checkpoint created", { checkpointId: id }); return { ok: true, message: `Checkpoint oluşturuldu: ${meta.label}`, data: meta }; }
    case "workspace_checkpoint_list": { const root = await workspaceCheckpointRoot(workdir); const ids = await fs.readdir(root, { withFileTypes: true }); const checkpoints = []; for (const entry of ids.filter((e) => e.isDirectory()).slice(-20).reverse()) { try { checkpoints.push(JSON.parse(await fs.readFile(path.join(root, entry.name, "checkpoint.json"), "utf8"))); } catch {} } return { ok: true, data: { checkpoints } }; }
    case "workspace_checkpoint_restore": { const root = await workspaceCheckpointRoot(workdir); const id = asString(args.checkpointId); const snapshot = resolveSafe(root, id); const stat = await fs.stat(snapshot).catch(() => null); if (!stat?.isDirectory()) return { ok: false, error: `Checkpoint bulunamadı: ${id}` }; await restoreWorkspaceSnapshot(workdir, snapshot); credentials.reportProgress?.("Checkpoint restored", { checkpointId: id }); return { ok: true, message: `Checkpoint geri yüklendi: ${id}`, data: { checkpointId: id } }; }
    case "page_navigate": { const b = await browserSession(credentials.workspaceId || "default"); const tab = activeBrowserTab(b); await tab.page.goto(asString(args.url), { waitUntil: "domcontentloaded", timeout: 30_000 }); await syncTab(tab); credentials.reportProgress?.(`Opened ${tab.title}`); return { ok: true, message: `Sayfa açıldı: ${tab.url}`, data: { tabId: tab.id, url: tab.url, title: tab.title } }; }
    case "element_click": { const b = await browserSession(credentials.workspaceId || "default"); await activeBrowserTab(b).page.locator(asString(args.selector)).first().click({ timeout: 15_000 }); credentials.reportProgress?.("Element clicked"); return { ok: true, message: `Tıklandı: ${asString(args.selector)}` }; }
    case "form_type": { const b = await browserSession(credentials.workspaceId || "default"); await activeBrowserTab(b).page.locator(asString(args.selector)).first().fill(asString(args.text), { timeout: 15_000 }); credentials.reportProgress?.("Text entered"); return { ok: true, message: `Yazıldı: ${asString(args.selector)}` }; }
    case "element_hover": { const b = await browserSession(credentials.workspaceId || "default"); await activeBrowserTab(b).page.locator(asString(args.selector)).first().hover({ timeout: 15_000 }); credentials.reportProgress?.("Element hovered"); return { ok: true, message: `Üzerine gelindi: ${asString(args.selector)}` }; }
    case "page_scroll": { const b = await browserSession(credentials.workspaceId || "default"); const amount = Number(args.amount) || 600; await activeBrowserTab(b).page.mouse.wheel(0, amount); credentials.reportProgress?.(`Scrolled ${amount}px`); return { ok: true, message: `Sayfa ${amount}px kaydırıldı.` }; }
    case "dom_inspect": { const b = await browserSession(credentials.workspaceId || "default"); const selector = asString(args.selector, "body"); const content = await activeBrowserTab(b).page.locator(selector).first().evaluate((el) => ({ tag: el.tagName, text: (el.textContent || "").slice(0, 12000), html: (el as HTMLElement).outerHTML.slice(0, 16000) })); credentials.reportProgress?.("DOM inspected"); return { ok: true, data: content }; }
    case "screenshot": { const b = await browserSession(credentials.workspaceId || "default"); const buffer = await activeBrowserTab(b).page.screenshot({ type: "png", fullPage: false }); credentials.reportProgress?.("Screenshot captured"); return { ok: true, message: "Tarayıcı ekran görüntüsü hazır.", data: { url: activeBrowserTab(b).page.url(), image: `data:image/png;base64,${buffer.toString("base64")}` } }; }
    case "browser_back": { const b = await browserSession(credentials.workspaceId || "default"); const tab = activeBrowserTab(b); await tab.page.goBack({ waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => null); await syncTab(tab); return { ok: true, message: `Geri gidildi: ${tab.url}`, data: { tabId: tab.id, url: tab.url, title: tab.title } }; }
    case "browser_forward": { const b = await browserSession(credentials.workspaceId || "default"); const tab = activeBrowserTab(b); await tab.page.goForward({ waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => null); await syncTab(tab); return { ok: true, message: `İleri gidildi: ${tab.url}`, data: { tabId: tab.id, url: tab.url, title: tab.title } }; }
    case "browser_reload": { const b = await browserSession(credentials.workspaceId || "default"); const tab = activeBrowserTab(b); await tab.page.reload({ waitUntil: "domcontentloaded", timeout: 15_000 }); await syncTab(tab); return { ok: true, message: `Yenilendi: ${tab.url}`, data: { tabId: tab.id, url: tab.url, title: tab.title } }; }
    case "browser_tab_open": { const b = await browserSession(credentials.workspaceId || "default"); const page = await b.browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }); const id = randomUUID().slice(0, 8); const tab: BrowserTab = { id, page, title: "Yeni sekme", url: "about:blank" }; b.tabs.set(id, tab); b.activeTabId = id; if (asString(args.url)) { await page.goto(asString(args.url), { waitUntil: "domcontentloaded", timeout: 30_000 }); await syncTab(tab); } return { ok: true, message: `Sekme açıldı: ${tab.title}`, data: { tabId: id, url: tab.url, title: tab.title } }; }
    case "browser_tab_close": { const b = await browserSession(credentials.workspaceId || "default"); const id = asString(args.tabId, b.activeTabId); const tab = b.tabs.get(id); if (!tab) return { ok: false, error: `Sekme bulunamadı: ${id}` }; await tab.page.close().catch(() => undefined); b.tabs.delete(id); if (b.tabs.size === 0) { const page = await b.browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }); const nextId = randomUUID().slice(0, 8); b.tabs.set(nextId, { id: nextId, page, title: "Yeni sekme", url: "about:blank" }); b.activeTabId = nextId; } else if (b.activeTabId === id) b.activeTabId = [...b.tabs.keys()][0]; return { ok: true, message: "Sekme kapatıldı.", data: { activeTabId: b.activeTabId } }; }
    case "browser_tab_switch": { const b = await browserSession(credentials.workspaceId || "default"); const tab = b.tabs.get(asString(args.tabId)); if (!tab) return { ok: false, error: `Sekme bulunamadı: ${asString(args.tabId)}` }; b.activeTabId = tab.id; await syncTab(tab); return { ok: true, message: `Sekme değiştirildi: ${tab.title}`, data: { tabId: tab.id, url: tab.url, title: tab.title } }; }
    case "browser_tabs": { const b = await browserSession(credentials.workspaceId || "default"); const tabs = await Promise.all([...b.tabs.values()].map(async (tab) => { await syncTab(tab); return { tabId: tab.id, url: tab.url, title: tab.title, active: tab.id === b.activeTabId }; })); return { ok: true, data: { activeTabId: b.activeTabId, tabs } }; }
    case "browser_vision": {
      const b = await browserSession(credentials.workspaceId || "default");
      const buffer = await activeBrowserTab(b).page.screenshot({ type: "png", fullPage: false });
      const image = `data:image/png;base64,${buffer.toString("base64")}`;
      if (!credentials.visionAccountId || !credentials.visionApiToken) return { ok: false, error: "Vision bağlantısı yapılandırılmamış." };
      const model = credentials.visionModel || "@cf/qwen/qwen3.8-27b";
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.visionAccountId}/ai/v1/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${credentials.visionApiToken}` }, body: JSON.stringify({ model, stream: false, max_tokens: 2048, messages: [{ role: "user", content: [{ type: "text", text: asString(args.prompt, "Bu tarayıcı ekranını analiz et. Görünür metinleri, önemli kontrolleri, düzeni ve kullanıcının amacı açısından ilgili öğeleri belirt.") }, { type: "image_url", image_url: { url: image } }] }] }) });
      const json = await response.json().catch(() => null);
      if (!response.ok) return { ok: false, error: `Vision ${response.status}: ${JSON.stringify(json).slice(0, 1000)}` };
      const content = json && typeof json === "object" && Array.isArray((json as any).choices) ? (json as any).choices[0]?.message?.content : "";
      if (!content) return { ok: false, error: "Vision modeli boş yanıt döndürdü." };
      credentials.reportProgress?.("Vision analysis completed");
      return { ok: true, content: typeof content === "string" ? content : JSON.stringify(content), data: { url: activeBrowserTab(b).page.url(), model } };
    }
    case "image_view": { const p = resolveSafe(workdir, asString(args.path)); try { const stat = await fs.stat(p); return { ok: stat.isFile(), message: stat.isFile() ? `Görsel hazır: ${asString(args.path)}` : "Görsel dosyası değil." }; } catch { return { ok: false, error: `Görsel bulunamadı: ${asString(args.path)}` }; } }
    case "planning": case "reasoning": case "skills_load": case "skills_unload": { return { ok: true, message: `${name} tamamlandı.`, data: args }; }
    case "api_request": { return { ok: false, error: "API isteği için güvenli connector yapılandırılmamış." }; }
    case "deploy": { return { ok: false, error: "Deploy connector yapılandırılmadan yayınlama yapılamaz." }; }
    case "artifact_create": {
      if (!credentials.workspaceMode) return { ok: false, error: "Artifact için workspace modu gerekli." };
      const record = await artifactCreate(workdir, { name: asString(args.name, "artifact"), mime: asString(args.mime, "text/plain"), content: asString(args.content) });
      credentials.reportProgress?.("Artifact created", { id: record.id });
      return { ok: true, message: `Artifact oluşturuldu: ${record.name}`, data: record };
    }
    case "artifact_list": {
      const artifacts = await artifactList(workdir);
      return { ok: true, data: { artifacts } };
    }
    case "deep_research": {
      if (!credentials.firecrawlApiKey) return { ok: false, error: "Deep Research için Firecrawl API anahtarı gerekli." };
      credentials.reportProgress?.("Researching sources", { stage: "search" });
      const result = await deepResearch(credentials.firecrawlApiKey, asString(args.query), Math.min(Number(args.limit) || 6, 8));
      if (result.ok) credentials.reportProgress?.(`Found ${result.sourceCount} sources`, { count: result.sourceCount, stage: "sources" });
      return result.ok ? { ok: true, results: result.sources, data: result } : result;
    }
    case "agent_task_create": {
      const task = await saveTask({ workspaceId: credentials.workspaceId || "default", prompt: asString(args.prompt), runAt: asString(args.runAt), repeatMinutes: Number(args.repeatMinutes) || undefined, enabled: true });
      return { ok: true, message: `Agent görevi oluşturuldu: ${task.id}`, data: task };
    }
    case "agent_task_list": {
      return { ok: true, data: { tasks: await listTasks(credentials.workspaceId || "default") } };
    }
    case "agent_task_delete": {
      return { ok: true, data: { tasks: await deleteTask(credentials.workspaceId || "default", asString(args.taskId)) } };
    }
    case "agent_delegate": {
      const roles = asString(args.roles).split(",").map((value) => value.trim()).filter((value) => ["explorer", "coder", "tester", "reviewer", "researcher"].includes(value)) as any[];
      const plan = buildDelegationPlan(asString(args.goal), roles.length ? roles : undefined);
      credentials.reportProgress?.(`Delegated ${plan.length} agent roles`, { stage: "delegation", count: plan.length });
      return { ok: true, message: `${plan.length} alt-agent görevi planlandı.`, data: { plan } };
    }
    case "agent_job_create": {
      const task = await saveTask({ workspaceId: credentials.workspaceId || "default", prompt: asString(args.prompt), runAt: asString(args.runAt, new Date(Date.now() + 3600000).toISOString()), repeatMinutes: Number(args.repeatMinutes) || undefined, enabled: true });
      return { ok: true, message: `Uzun Agent işi oluşturuldu: ${task.id}`, data: { ...task, kind: "long-running" } };
    }
    case "agent_job_list": {
      return { ok: true, data: { jobs: (await listTasks(credentials.workspaceId || "default")).filter((task) => task.enabled !== false) } };
    }
    case "agent_job_cancel": {
      return { ok: true, data: { jobs: await deleteTask(credentials.workspaceId || "default", asString(args.taskId)) } };
    }
    case "maintenance_plan_create": {
      const plan = await saveMaintenancePlan({ workspaceId: credentials.workspaceId || "default", name: asString(args.name, "Roxan Maintenance"), prompt: asString(args.prompt), intervalMinutes: Math.max(60, Number(args.intervalMinutes) || 1440), enabled: true });
      return { ok: true, message: `Bakım planı oluşturuldu: ${plan.name}`, data: plan };
    }
    case "maintenance_plan_list": {
      return { ok: true, data: { plans: await listMaintenancePlans(credentials.workspaceId || "default") } };
    }
    case "maintenance_plan_delete": {
      return { ok: true, data: { plans: await deleteMaintenancePlan(credentials.workspaceId || "default", asString(args.planId)) } };
    }
    case "skill_catalog": {
      return { ok: true, data: { catalog: BUILTIN_SKILLS, installed: await listInstalledSkills(workdir) } };
    }
    case "skill_install": {
      const skill = await installSkill(workdir, asString(args.id));
      credentials.reportProgress?.(`Installed skill: ${skill.name}`, { stage: "skill" });
      return { ok: true, message: `Skill yüklendi: ${skill.name}`, data: skill };
    }
    case "skill_uninstall": {
      const ids = await uninstallSkill(workdir, asString(args.id));
      return { ok: true, message: "Skill kaldırıldı.", data: { ids } };
    }
    case "workspace_members": {
      return { ok: true, data: await getSharedWorkspace(workdir, credentials.workspaceId || "default") };
    }
    case "workspace_member_add": {
      const role = ["editor", "viewer"].includes(asString(args.role)) ? asString(args.role) as "editor" | "viewer" : "viewer";
      return { ok: true, data: await addWorkspaceMember(workdir, credentials.workspaceId || "default", { name: asString(args.name), email: asString(args.email) || undefined, role }) };
    }
    case "workspace_member_remove": {
      return { ok: true, data: await removeWorkspaceMember(workdir, credentials.workspaceId || "default", asString(args.memberId)) };
    }
    case "project_archive": {
      credentials.reportProgress?.("Collecting project files");
      const filename = sanitizeArchiveName(asString(args.filename, "roxan-project"));
      const outputDir = path.join(workdir, "output");
      await fs.mkdir(outputDir, { recursive: true });
      await writeZipFromDirectory(workdir, path.join(outputDir, filename));
      return { ok: true, message: "Proje ZIP çıktısı hazır.", data: { filename, outputPath: `output/${filename}`, downloadUrl: `/api/project?download=1&workspaceId=${encodeURIComponent(credentials.workspaceId || "default")}&filename=${encodeURIComponent(filename)}` } };
    }
    case "web_search": {
      if (!credentials.firecrawlApiKey) {
        return { ok: false, error: "Firecrawl API anahtarı yapılandırılmamış. Ayarlar'dan FireCrawl key ekle." };
      }
      try {
        const response = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${credentials.firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: asString(args.query),
            limit: Math.min(Number(args.limit) || 5, 10),
            scrapeOptions: { formats: ["markdown"] },
          }),
        });
        const data = (await readResponseBody(response)) as {
          data?: { url?: string; title?: string; description?: string; snippet?: string; markdown?: string }[];
          results?: { url?: string; title?: string; description?: string; snippet?: string; markdown?: string }[];
        };
        const results = (data?.data || data?.results || []).slice(0, 10).map((item) => ({
          url: item.url,
          title: item.title || item.url,
          description: item.description || item.snippet || "",
          content: (item.markdown || "").slice(0, 1200),
        }));
        return { ok: true, results };
      } catch (error) {
        return { ok: false, error: String(error instanceof Error ? error.message : error) };
      }
    }
    case "memory_add": {
      return mem0Request(credentials.mem0ApiKey, "/v1/memories/", {
        method: "POST",
        body: JSON.stringify({
          user_id: MEMORY_USER_ID,
          messages: [{ role: "user", content: asString(args.content) }],
          infer: true,
        }),
      });
    }
    case "memory_recall": {
      const result = await mem0Request(credentials.mem0ApiKey, "/v1/memories/search/", {
        method: "POST",
        body: JSON.stringify({
          user_id: MEMORY_USER_ID,
          query: asString(args.query),
          limit: Math.min(Number(args.limit) || 5, 10),
        }),
      });
      if (!result.ok) return result;
      return { ok: true, memories: result.data };
    }
    case "memory_edit": {
      return mem0Request(
        credentials.mem0ApiKey,
        `/v1/memories/${encodeURIComponent(asString(args.memory_id))}/`,
        {
          method: "PUT",
          body: JSON.stringify({ text: asString(args.text) }),
        },
      );
    }
    case "memory_remove": {
      return mem0Request(
        credentials.mem0ApiKey,
        `/v1/memories/${encodeURIComponent(asString(args.memory_id))}/`,
        { method: "DELETE" },
      );
    }
    default:
      return { ok: false, error: `Bu tool henüz uygulanmadı: ${name}` };
  }
}

export function summarizeArgs(args: Record<string, unknown>) {
  if (typeof args.path === "string") return args.path;
  if (typeof args.from === "string") return args.from;
  if (typeof args.query === "string") return args.query;
  if (typeof args.command === "string") return args.command;
  if (typeof args.content === "string") return args.content.slice(0, 80);
  return undefined;
}

export function summarizeResult(result: ToolResult) {
  if (result.error) return result.error;
  if (result.message) return result.message;
  return undefined;
}
