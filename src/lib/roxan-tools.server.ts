import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { extractZipFile, sanitizeArchiveName, writeZipFromDirectory } from "@/lib/archive.server";
import { BUILD_AGENT_MD, isLegacyGeneratedAgent } from "@/lib/build-agent-instructions";

const execAsync = promisify(exec);

const MEM0_BASE_URL = (process.env.MEM0_API_URL || "https://api.mem0.ai").replace(/\/$/, "");
const MEMORY_USER_ID = process.env.ROXAN_MEMORY_USER_ID || "roxan-local-user";

export type ToolCredentials = {
  firecrawlApiKey?: string;
  mem0ApiKey?: string;
  workspaceMode?: boolean;
  workspaceId?: string;
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
  fn("page_navigate", "Tarayıcı sayfasına git.", { type: "object", properties: { url: { type: "string" } }, required: ["url"] }),
  fn("element_click", "Tarayıcıdaki elementi tıkla.", { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }),
  fn("form_type", "Tarayıcı form alanına yaz.", { type: "object", properties: { selector: { type: "string" }, text: { type: "string" } }, required: ["selector", "text"] }),
  fn("element_hover", "Tarayıcı elementinin üzerine gel.", { type: "object", properties: { selector: { type: "string" } }, required: ["selector"] }),
  fn("page_scroll", "Tarayıcı sayfasını kaydır.", { type: "object", properties: { amount: { type: "integer" } }, required: ["amount"] }),
  fn("dom_inspect", "Tarayıcı DOM yapısını incele.", { type: "object", properties: { selector: { type: "string" } } }),
  fn("screenshot", "Tarayıcı ekran görüntüsü al.", { type: "object", properties: {} }),
  fn("image_view", "Workspace içindeki görseli inceleme için hazırla.", { type: "object", properties: { path: { type: "string" } }, required: ["path"] }),
  fn("planning", "İsteği uygulanabilir kısa adımlara ayır.", { type: "object", properties: { steps: { type: "string" } }, required: ["steps"] }),
  fn("reasoning", "Karar için kısa gerekçe ve varsayımları kaydet.", { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] }),
  fn("skills_load", "Bir workspace yeteneğini etkinleştir.", { type: "object", properties: { name: { type: "string" } }, required: ["name"] }),
  fn("skills_unload", "Bir workspace yeteneğini devre dışı bırak.", { type: "object", properties: { name: { type: "string" } }, required: ["name"] }),
  fn("api_request", "Yapılandırılmış harici API isteği hazırlamak için kullan.", { type: "object", properties: { url: { type: "string" }, method: { type: "string" } }, required: ["url"] }),
  fn("deploy", "Deploy öncesi yapılandırmayı kontrol et; kullanıcı açıkça istemeden yayınlama.", { type: "object", properties: { target: { type: "string" } }, required: ["target"] }),
  fn("project_archive", "Workspace projesini ZIP olarak paketle ve kullanıcıya indirilebilir çıktı ver; sistem zip komutu kullanma.", { type: "object", properties: { filename: { type: "string" } } }),
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

async function readResponseBody(response: Response) {
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

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  credentials: ToolCredentials = {},
): Promise<ToolResult> {
  const workdir = await getWorkdir(Boolean(credentials.workspaceMode), credentials.workspaceId);
  const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);

  switch (name) {
    case "file_read": {
      const p = resolveSafe(workdir, asString(args.path));
      try {
        const content = await fs.readFile(p, "utf-8");
        return { ok: true, content: content.slice(0, 12000) };
      } catch (error) {
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
    case "page_navigate": case "element_click": case "form_type": case "element_hover": case "page_scroll": case "dom_inspect": case "screenshot": { return { ok: false, error: "Tarayıcı connector bu Roxan dağıtımında yapılandırılmamış; browser connector etkinleştirildiğinde bu tool doğrudan kullanılabilir." }; }
    case "image_view": { const p = resolveSafe(workdir, asString(args.path)); try { const stat = await fs.stat(p); return { ok: stat.isFile(), message: stat.isFile() ? `Görsel hazır: ${asString(args.path)}` : "Görsel dosyası değil." }; } catch { return { ok: false, error: `Görsel bulunamadı: ${asString(args.path)}` }; } }
    case "planning": case "reasoning": case "skills_load": case "skills_unload": { return { ok: true, message: `${name} tamamlandı.`, data: args }; }
    case "api_request": { return { ok: false, error: "API isteği için güvenli connector yapılandırılmamış." }; }
    case "deploy": { return { ok: false, error: "Deploy connector yapılandırılmadan yayınlama yapılamaz." }; }
    case "project_archive": {
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
