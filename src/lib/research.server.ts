import { readResponseBody } from "@/lib/roxan-tools.server";

type Source = { url: string; title: string; description: string; content: string };

export async function deepResearch(apiKey: string, query: string, limit = 6) {
  if (!apiKey) return { ok: false, error: "Firecrawl API anahtarı yapılandırılmamış." };
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: Math.min(Math.max(limit, 3), 8), scrapeOptions: { formats: ["markdown"] } }),
    });
    const data = (await readResponseBody(response)) as { data?: Source[]; results?: Source[] };
    if (!response.ok) return { ok: false, error: `Araştırma servisi ${response.status} döndürdü.` };
    const sources = (data.data || data.results || []).filter((item) => item?.url).map((item) => ({
      url: item.url,
      title: item.title || item.url,
      description: item.description || "",
      content: (item.content || "").slice(0, 5000),
    }));
    return { ok: true, query, sources, sourceCount: sources.length };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
