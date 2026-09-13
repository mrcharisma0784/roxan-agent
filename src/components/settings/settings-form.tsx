import * as React from "react";
import { CalendarClock, ChevronDown, ChevronUp, Eye, EyeOff, Plug, Sparkles, UserRound, Trash2, Users, Wrench, Store, Workflow } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TOOL_CATEGORIES } from "@/lib/tools";
import {
  hasMemory,
  isConfigured,
  useRoxan,
  type Personalization,
  type RoxanSettings,
} from "@/store/roxan";

export function SettingsForm() {
  const hydrated = useRoxan((state) => state.hydrated);
  const saved = useRoxan((state) => state.settings);
  const saveSettings = useRoxan((state) => state.saveSettings);
  const [draft, setDraft] = useState<RoxanSettings>(saved);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [memories, setMemories] = useState<{ id?: string; title?: string; text: string }[]>([]);
  const [openMemory, setOpenMemory] = useState<string | null>(null);
  const agentTasks = useRoxan((state) => state.agentTasks);
  const setAgentTasks = useRoxan((state) => state.setAgentTasks);
  const [taskPrompt, setTaskPrompt] = useState("");
  const [taskRunAt, setTaskRunAt] = useState("");

  useEffect(() => {
    if (hydrated) setDraft(saved);
  }, [hydrated, saved]);

  useEffect(() => {
    if (!hydrated) return;
    const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default";
    fetch(`/api/tasks?workspaceId=${encodeURIComponent(workspaceId)}`).then(async (response) => response.ok ? (await response.json()) as { tasks?: any[] } : null).then((data) => { if (data?.tasks) setAgentTasks(data.tasks); }).catch(() => undefined);
  }, [hydrated, setAgentTasks]);

  useEffect(() => {
    if (!hydrated || !saved.mem0ApiKey) return;
    fetch("/api/memory/list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: saved.mem0ApiKey }) })
      .then(async (response) => response.ok ? (await response.json()) as { memories?: unknown } : null)
      .then((data) => {
        const rows = Array.isArray(data?.memories) ? data.memories : [];
        setMemories(rows.map((item, index) => { const record = item as Record<string, unknown>; return { id: String(record.id ?? index), title: String(record.title ?? record.category ?? "").trim() || undefined, text: String(record.memory ?? record.text ?? record.content ?? record.message ?? "").trim() }; }).filter((item) => item.text));
      }).catch(() => setMemories([]));
  }, [hydrated, saved.mem0ApiKey]);

  function update<K extends keyof RoxanSettings>(key: K, value: RoxanSettings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updatePersonalization<K extends keyof Personalization>(key: K, value: Personalization[K]) {
    setDraft((current) => ({
      ...current,
      personalization: { ...current.personalization, [key]: value },
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextSettings: RoxanSettings = {
      workerUrl: draft.workerUrl.trim(),
      accountId: draft.accountId.trim(),
      apiToken: draft.apiToken.trim(),
      backupAccountId: draft.backupAccountId.trim(),
      backupApiToken: draft.backupApiToken.trim(),
      model: draft.modelProfiles.defaultModel.trim(),
      modelProfiles: {
        defaultModel: draft.modelProfiles.defaultModel.trim(),
        agenticModel: draft.modelProfiles.agenticModel.trim(),
        flashModel: draft.modelProfiles.flashModel.trim(),
        visionModel: draft.modelProfiles.visionModel.trim(),
      },
      visionAccountId: "",
      visionApiToken: "",
      visionModel: draft.modelProfiles.visionModel.trim(),
      firecrawlApiKey: draft.firecrawlApiKey.trim(),
      mem0ApiKey: draft.mem0ApiKey.trim(),
      personalization: {
        nickname: draft.personalization.nickname.trim(),
        preferences: draft.personalization.preferences.trim(),
        speakingStyle: draft.personalization.speakingStyle.trim(),
      },
    };
    saveSettings(nextSettings);

    if (nextSettings.mem0ApiKey && Object.values(nextSettings.personalization).some(Boolean)) {
      fetch("/api/memory/personalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: nextSettings.mem0ApiKey,
          personalization: nextSettings.personalization,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            const data = (await response.json().catch(() => null)) as { message?: string } | null;
            throw new Error(data?.message || "Mem0 kaydı başarısız.");
          }
          toast("Ayarlar ve kişiselleştirme kaydedildi.");
        })
        .catch(() => toast("Ayarlar kaydedildi; kişiselleştirme Mem0'ya yazılamadı."));
    } else {
      toast("Ayarlar kaydedildi.");
    }
  }

  const ready = isConfigured(draft);
  const memoryReady = hasMemory(draft);

  function toggleVisible(key: string) {
    setVisibleFields((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-lg flex-col gap-7 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-muted uppercase">Kurulum</p>
        <h1 className="font-display text-4xl tracking-tight text-fg italic">Ayarlar</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          Bağlantılarını ve Roxan’ın sana nasıl yanıt vereceğini buradan yönet.
        </p>
      </div>

      <SettingsSection
        title="Model bağlantısı"
        description="Cloudflare Workers AI bilgilerin bu cihazda saklanır."
        icon={<Sparkles className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <Field id="account-id" label="Account ID">
          <Input
            id="account-id"
            value={draft.accountId}
            onChange={(event) => update("accountId", event.target.value)}
            placeholder="Cloudflare hesap kimliği"
            autoComplete="off"
            spellCheck={false}
            disabled={!hydrated}
          />
        </Field>
        <Field id="api-token" label="API Token">
          <SecretInput
            id="api-token"
            value={draft.apiToken}
            onChange={(value) => update("apiToken", value)}
            placeholder="Cloudflare API token"
            disabled={!hydrated}
            visible={Boolean(visibleFields.apiToken)}
            onToggle={() => toggleVisible("apiToken")}
          />
        </Field>
        <Field id="backup-account-id" label="Yedek Account ID"><Input id="backup-account-id" value={draft.backupAccountId} onChange={(event) => update("backupAccountId", event.target.value)} placeholder="İsteğe bağlı yedek hesap" autoComplete="off" spellCheck={false} disabled={!hydrated} /></Field>
        <Field id="backup-api-token" label="Yedek API Token"><SecretInput id="backup-api-token" value={draft.backupApiToken} onChange={(value) => update("backupApiToken", value)} placeholder="İsteğe bağlı yedek token" disabled={!hydrated} visible={Boolean(visibleFields.backupApiToken)} onToggle={() => toggleVisible("backupApiToken")} /></Field>
      </SettingsSection>

      <SettingsSection title="Model profilleri" description="Chat, Build ve görsel işlemleri için kullanılacak modeller." icon={<Eye className="size-4 text-muted" strokeWidth={1.7} />}>
        <Field id="default-model" label="Default"><Input id="default-model" value={draft.modelProfiles.defaultModel} onChange={(event) => setDraft((current) => ({ ...current, modelProfiles: { ...current.modelProfiles, defaultModel: event.target.value } }))} placeholder="@cf/openai/gpt-oss-120b" disabled={!hydrated} /></Field>
        <Field id="agentic-model" label="Agentic"><Input id="agentic-model" value={draft.modelProfiles.agenticModel} onChange={(event) => setDraft((current) => ({ ...current, modelProfiles: { ...current.modelProfiles, agenticModel: event.target.value } }))} placeholder="@cf/nvidia/nemotron-3-120b-a12b" disabled={!hydrated} /></Field>
        <Field id="flash-model" label="Flash"><Input id="flash-model" value={draft.modelProfiles.flashModel} onChange={(event) => setDraft((current) => ({ ...current, modelProfiles: { ...current.modelProfiles, flashModel: event.target.value } }))} placeholder="@cf/zai-org/glm-4.7-flash" disabled={!hydrated} /></Field>
        <Field id="vision-model" label="Vision"><Input id="vision-model" value={draft.modelProfiles.visionModel} onChange={(event) => setDraft((current) => ({ ...current, modelProfiles: { ...current.modelProfiles, visionModel: event.target.value } }))} placeholder="@cf/qwen/qwen3.8-27b" disabled={!hydrated} /></Field>
      </SettingsSection>

      <div id="memory"><SettingsSection
        title="Yetenek bağlantıları"
        description="Web araması ve hafıza özelliklerini etkinleştir."
        icon={<Plug className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <Field
          id="firecrawl-api-key"
          label="FireCrawl API Key"
          hint="Web Search anahtarı yoksa sohbet içindeki toggle pasif kalır."
        >
          <SecretInput
            id="firecrawl-api-key"
            value={draft.firecrawlApiKey}
            onChange={(value) => update("firecrawlApiKey", value)}
            placeholder="fc-..."
            disabled={!hydrated}
            visible={Boolean(visibleFields.firecrawlApiKey)}
            onToggle={() => toggleVisible("firecrawlApiKey")}
          />
        </Field>
        <Field
          id="mem0-api-key"
          label="Mem0 API Key"
          hint="Hafıza işlemi istendiğinde bu anahtar kullanılır."
        >
          <SecretInput
            id="mem0-api-key"
            value={draft.mem0ApiKey}
            onChange={(value) => update("mem0ApiKey", value)}
            placeholder="Mem0 API key"
            disabled={!hydrated}
            visible={Boolean(visibleFields.mem0ApiKey)}
            onToggle={() => toggleVisible("mem0ApiKey")}
          />
        </Field>
        <div
          className={cn(
            "inline-flex items-center gap-2 pt-0.5 text-xs text-muted",
            memoryReady && "text-fg",
          )}
        >
          <span className={cn("size-1.5 rounded-full bg-subtle", memoryReady && "bg-fg")} />
          {memoryReady ? "Memory bağlı" : "Memory henüz bağlı değil"}
        </div>
      </SettingsSection></div>

      <SettingsSection
        title="Personalization"
        description="Boş bırakabilirsin. Doldurduğunda Mem0’ya otomatik kaydedilir."
        icon={<UserRound className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <Field id="nickname" label="Takma ad" hint="Roxan sana nasıl hitap etsin?">
          <Input
            id="nickname"
            value={draft.personalization?.nickname || ""}
            onChange={(event) => updatePersonalization("nickname", event.target.value)}
            placeholder="Örn. Alper"
            disabled={!hydrated}
          />
        </Field>
        <Field
          id="preferences"
          label="Tercihler"
          hint="İlgi alanların, çalışma biçimin veya bilinmesini istediğin şeyler."
        >
          <Textarea
            id="preferences"
            value={draft.personalization?.preferences || ""}
            onChange={(event) => updatePersonalization("preferences", event.target.value)}
            placeholder="Örn. Türkçe yanıtları ve kısa özetleri tercih ederim."
            disabled={!hydrated}
            className="min-h-20 rounded-xl bg-bg-elevated px-4 py-3 text-sm shadow-border placeholder:text-subtle focus-visible:shadow-border-hover"
          />
        </Field>
        <Field
          id="speaking-style"
          label="Agent nasıl konuşmalı?"
          hint="Ton, uzunluk ve yaklaşımını tarif et."
        >
          <Textarea
            id="speaking-style"
            value={draft.personalization?.speakingStyle || ""}
            onChange={(event) => updatePersonalization("speakingStyle", event.target.value)}
            placeholder="Örn. Sade, doğrudan ve gerektiğinde örneklerle."
            disabled={!hydrated}
            className="min-h-20 rounded-xl bg-bg-elevated px-4 py-3 text-sm shadow-border placeholder:text-subtle focus-visible:shadow-border-hover"
          />
        </Field>
      </SettingsSection>

      <SettingsSection
        title="Memory"
        description={memoryReady ? "Agent hafızasındaki kayıtlar." : "Memory bağlandığında kayıtların burada görünür."}
        icon={<Sparkles className="size-4 text-muted" strokeWidth={1.7} />}
      >
        {memories.length > 0 ? memories.map((memory) => {
          const expanded = openMemory === memory.id;
          const long = memory.text.length > 120;
          return (
            <button key={memory.id} type="button" className="w-full rounded-xl bg-bg-subtle p-3 text-left text-sm text-fg hover:bg-bg-subtle/80" onClick={() => long && setOpenMemory(expanded ? null : memory.id || null)}>
              {memory.title && long ? <span className="flex items-center justify-between gap-3 font-semibold"><span>{memory.title}</span>{expanded ? <ChevronUp className="size-4 text-muted" /> : <ChevronDown className="size-4 text-muted" />}</span> : null}
              <span className={cn("block whitespace-pre-wrap break-words leading-relaxed", memory.title && long && !expanded && "mt-1 line-clamp-2 text-muted")}>{memory.text}</span>
            </button>
          );
        }) : <p className="text-sm text-muted">Henüz gösterilecek kayıt bulunamadı.</p>}
      </SettingsSection>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{ready ? "Model kurulumu tamam." : "Model bağlantısı eksik."}</p>
        <Button type="submit" disabled={!hydrated}>
          Kaydet
        </Button>
      </div>

      <SettingsSection title="Background Agent" description="Uygulama açıkken planlanmış Agent görevlerini çalıştırır. Vercel cron bağlandığında uygulama kapalıyken de tetiklenebilir." icon={<CalendarClock className="size-4 text-muted" strokeWidth={1.7} />}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Textarea value={taskPrompt} onChange={(event) => setTaskPrompt(event.target.value)} placeholder="Örn. Projeyi test et, hata varsa düzelt ve özetle." className="min-h-20 rounded-xl bg-bg-elevated px-4 py-3 text-sm shadow-border" /><div className="flex flex-col gap-2"><Input type="datetime-local" value={taskRunAt} onChange={(event) => setTaskRunAt(event.target.value)} className="w-full sm:w-56" /><Button type="button" disabled={!taskPrompt.trim() || !taskRunAt} onClick={async () => { const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default"; const response = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create", workspaceId, prompt: taskPrompt.trim(), runAt: new Date(taskRunAt).toISOString() }) }); if (response.ok) { const data = await response.json() as { task?: any }; if (data.task) setAgentTasks([...agentTasks, data.task]); setTaskPrompt(""); setTaskRunAt(""); toast("Agent görevi planlandı."); } else toast("Görev oluşturulamadı."); }}>Planla</Button></div></div>
        {agentTasks.length ? <div className="flex flex-col gap-2">{agentTasks.map((task) => <div key={task.id} className="flex items-center gap-3 rounded-xl bg-bg-subtle p-3"><div className="min-w-0 flex-1"><div className="truncate text-sm text-fg">{task.prompt}</div><div className="mt-1 text-xs text-muted">{new Date(task.runAt).toLocaleString()}</div></div><Button type="button" variant="outline" size="iconSm" onClick={async () => { const workspaceId = task.workspaceId || "default"; await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", workspaceId, taskId: task.id }) }); setAgentTasks(agentTasks.filter((item) => item.id !== task.id)); }} aria-label="Görevi sil"><Trash2 className="size-3.5" /></Button></div>)}</div> : <p className="m-0 text-xs text-muted">Henüz planlanmış görev yok.</p>}
      </SettingsSection>
      <SettingsSection
        title="Multi-Agent"
        description="Roxan görevleri explorer, coder, tester ve reviewer rollerine bölebilir."
        icon={<Workflow className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Textarea id="delegation-goal" placeholder="Örn. ödeme akışını incele, düzelt ve test et." className="min-h-20 rounded-xl bg-bg-subtle px-3 py-3 text-sm" />
          <Button type="button" onClick={async () => {
            const el = document.getElementById("delegation-goal") as HTMLTextAreaElement | null;
            if (!el?.value.trim()) return;
            const response = await fetch("/api/agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delegate", goal: el.value.trim() }) });
            toast(response.ok ? "Multi-Agent planı oluşturuldu." : "Delegation planı oluşturulamadı.");
          }}>Plan oluştur</Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Otonom bakım"
        description="Workspace'i periyodik olarak kontrol eden bakım planları."
        icon={<Wrench className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <div className="grid gap-3">
          <Input id="maintenance-prompt" placeholder="Örn. testleri çalıştır, kırılan noktaları düzelt ve raporla." />
          <div className="flex items-center gap-2">
            <Input id="maintenance-name" placeholder="Plan adı" className="flex-1" />
            <Input id="maintenance-interval" type="number" min={60} defaultValue={1440} className="w-28" aria-label="Dakika" />
            <Button type="button" onClick={async () => {
              const prompt = (document.getElementById("maintenance-prompt") as HTMLInputElement | null)?.value.trim();
              if (!prompt) return;
              const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default";
              const name = (document.getElementById("maintenance-name") as HTMLInputElement | null)?.value.trim() || "Roxan Maintenance";
              const intervalMinutes = Number((document.getElementById("maintenance-interval") as HTMLInputElement | null)?.value || 1440);
              const response = await fetch("/api/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ workspaceId, name, prompt, intervalMinutes }) });
              toast(response.ok ? "Bakım planı kaydedildi." : "Bakım planı kaydedilemedi.");
            }}>Kaydet</Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Skill Marketplace"
        description="Kurulabilir yerleşik agent yetenekleri."
        icon={<Store className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {["frontend", "backend", "testing", "devops", "research"].map((id) => (
            <div key={id} className="flex items-center justify-between gap-2 rounded-xl bg-bg-subtle p-3">
              <div><div className="text-sm font-medium text-fg">{id}</div><div className="text-xs text-muted">Built-in skill</div></div>
              <Button type="button" variant="outline" size="sm" onClick={async () => { const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default"; const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "skill_install", id, workspaceId }) }); toast(response.ok ? `${id} skill yüklendi.` : `${id} yüklenemedi.`); }}>Yükle</Button>
            </div>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Shared Workspace"
        description="Workspace üyeleri ve roller için temel ekip alanı."
        icon={<Users className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input id="member-name" placeholder="Üye adı" />
          <Input id="member-email" placeholder="E-posta" />
          <Button type="button" onClick={async () => { const name = (document.getElementById("member-name") as HTMLInputElement | null)?.value.trim(); if (!name) return; const workspaceId = typeof window !== "undefined" ? window.localStorage.getItem("roxan-build-workspace") || "default" : "default"; const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "member_add", name, email: (document.getElementById("member-email") as HTMLInputElement | null)?.value.trim(), role: "viewer", workspaceId }) }); toast(response.ok ? "Workspace üyesi eklendi." : "Üye eklenemedi."); }}>Üye ekle</Button>
        </div>
        <p className="text-xs text-muted">Gerçek davet e-postası göndermek için e-posta/kimlik sağlayıcısı bağlantısı ayrıca gerekir.</p>
      </SettingsSection>

      <SettingsSection
        title="Agent araçları"
        description="Modelin bu dağıtımda çağırabildiği tüm tool'lar."
        icon={<Plug className="size-4 text-muted" strokeWidth={1.7} />}
      >
        <div className="flex flex-col gap-4">
          {TOOL_CATEGORIES.map((category) => (
            <div key={category.num} className="flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold tracking-widest text-muted uppercase">{category.num} · {category.label}</p>
              <div className="grid gap-1 sm:grid-cols-2">
                {category.tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div key={tool.id} className="flex min-w-0 items-center gap-2 rounded-lg bg-bg-subtle px-2.5 py-2 text-xs text-muted">
                      <Icon className="size-3.5 shrink-0" strokeWidth={1.7} />
                      <span className="min-w-0 truncate text-fg">{tool.id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </form>
  );
}

function SettingsSection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4 px-1">
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
        </div>
        {icon}
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-bg-elevated p-4 shadow-border sm:p-5">
        {children}
      </div>
    </section>
  );
}

function SecretInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  visible,
  onToggle,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        className="pr-12"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-fg"
        aria-label={visible ? "Anahtarı gizle" : "Anahtarı göster"}
      >
        {visible ? (
          <EyeOff className="size-4" strokeWidth={1.75} />
        ) : (
          <Eye className="size-4" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-subtle">{hint}</p> : null}
    </div>
  );
}
