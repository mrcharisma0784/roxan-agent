import * as React from "react";
import { ArrowUp, ChevronRight, FileText, Globe } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatView } from "@/components/chat/chat-view";

const PROJECT_TYPES: { icon: typeof Globe; title: string; text: string }[] = [];
const AGENT_MD = `# Roxan Build Workspace

## Rol
Sen full-stack proje geliştiren bir agentsın. Kullanıcı isteğini analiz eder, eksik ve kritik bilgileri ask toolu ile sorar, ardından çalışan ve doğrulanabilir bir proje üretirsin.

## Çalışma alanı
Bu klasör proje köküdür. Oluşturulan tüm dosyalar bu workspace içinde tutulmalıdır. Workspace dışına çıkma ve kullanıcı açıkça istemedikçe mevcut dosyaları silme.

## Kesin işlem sırası
1. Önce Workspace Instructions Read toolu ile bu AGENT.md dosyasını oku.
2. Kullanıcı selamlaşıyorsa hiçbir tool çağırmadan kısa yanıt ver.
3. Gerçek istekse ayrı bir Reasoning fazında isteği ve varsayımları değerlendir. Bu faz tamamlanmadan planlama yapma.
4. Ayrı bir Planning fazında adımları sırala. Reasoning ve Planning aynı anda çalışmaz.
5. Planı tek tek uygula; klasör/dosya gerekiyorsa gerçek Directory Creating, File Creating veya File Editing toolunu çağır.
6. Her adımdan sonra sonucu doğrula ve sonraki adıma geç.
7. Kullanıcı kararı gerekiyorsa Ask toolu çağır; mümkünse tam üç hazır seçenek üret ve yanıtı bekle.
8. Uygun test, typecheck, lint veya build komutlarını çalıştır.
9. Sonucu ve doğrulama durumunu açıkça bildir.

## Full-stack kapsamı
Frontend, backend/API, veri modeli, doğrulama, hata yönetimi ve çalıştırma talimatlarını birlikte ele al. Uygulama güvenli, responsive ve erişilebilir olmalıdır.

## Tool kullanımı
Dosya okumadan düzenleme yapma. Büyük dizinleri sınırsız yazdırma; explore kullan veya find/rg çıktısını sınırla. Komut çıktısını özetle. Dosya yollarında güvenli relative yollar kullan.

## Kalite
Her değişiklikten sonra ilgili dosyanın varlığını ve içeriğini kontrol et. Kullanıcıya yapılmayan bir işlemi yapılmış gibi söyleme.
`;

export function BuildView() {
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [startedPrompt, setStartedPrompt] = useState<string | null>(null);
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const idea = prompt.trim();
    const content = `${selected ? `${selected}: ` : ""}${idea}`.trim();
    if (!content) return;
    if (typeof window !== "undefined") window.localStorage.setItem("roxan-build-workspace", content.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 64) || "project");
    setPrompt("");
    setStartedPrompt(content);
  }
  if (startedPrompt) return <ChatView buildMode initialPrompt={startedPrompt} />;
  return <div className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><div className="build-hero mx-auto w-full max-w-2xl px-5 pb-8"><p className="mb-2.5 text-xs font-bold tracking-widest text-muted uppercase">Build modu · Workspace</p><h1 className="font-display text-5xl leading-none tracking-tight text-fg italic sm:text-6xl">Bir şeyler oluşturalım.</h1><p className="mt-3.5 mb-6 max-w-sm text-sm leading-relaxed text-muted">Roxan fikrini full-stack bir projeye dönüştürmeye hazır. Başladığında bu alan kapanır ve doğrudan Build sohbetine geçilir.</p><button type="button" onClick={() => setShowAgent((value) => !value)} className="mb-6 flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3 text-left shadow-border hover:bg-bg-subtle"><span className="grid size-9 place-items-center rounded-lg bg-bg-subtle"><FileText className="size-4" /></span><span className="flex-1"><strong className="block text-sm">AGENT.md</strong><small className="text-xs text-muted">Workspace yönlendirmeleri · varsayılan</small></span><ChevronRight className={cn("size-4 text-subtle transition-transform", showAgent && "rotate-90")} /></button>{showAgent ? <pre className="mb-6 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-bg-elevated p-4 text-xs leading-relaxed text-muted shadow-border">{AGENT_MD}</pre> : null}<div className="grid gap-2.5">{PROJECT_TYPES.map((project) => { const Icon = project.icon; return <button type="button" key={project.title} className={cn("flex w-full items-center gap-3 rounded-xl bg-bg-elevated p-3.5 text-left text-fg shadow-border hover:bg-bg-subtle hover:shadow-border-hover", selected === project.title && "bg-bg-subtle shadow-border-hover")} onClick={() => setSelected(project.title)}><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-bg-subtle"><Icon className="size-5" /></span><span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-sm font-semibold">{project.title}</strong><small className="text-xs text-muted">{project.text}</small></span><ChevronRight className="size-4 shrink-0 text-subtle" /></button>; })}</div></div></div><div className="build-composer-bar mx-auto mb-6 flex w-full max-w-2xl flex-col gap-2 px-4 sm:px-0">{selected ? <div className="flex items-center gap-2 px-1 text-xs text-muted"><span className="rounded-full bg-bg-subtle px-2.5 py-1.5 text-fg">{selected}</span></div> : null}<form className="flex items-center gap-2 rounded-2xl bg-bg-elevated p-2 pl-4 shadow-border-hover" onSubmit={onSubmit}><input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ne oluşturmak istiyorsun?" aria-label="Proje fikri" className="min-w-0 flex-1 border-0 bg-transparent text-sm text-fg outline-none placeholder:text-subtle" /><Button type="submit" size="iconSm" className="size-9 rounded-full" aria-label="Projeyi başlat"><ArrowUp className="size-4" /></Button></form></div></div>;
}
