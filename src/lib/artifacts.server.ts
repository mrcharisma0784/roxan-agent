import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type ArtifactRecord = { id: string; name: string; mime: string; content: string; createdAt: string; updatedAt: string };

export async function artifactCreate(workdir: string, input: { name?: string; mime?: string; content: string }) {
  const dir = path.join(workdir, ".roxan", "artifacts");
  await fs.mkdir(dir, { recursive: true });
  const record: ArtifactRecord = { id: randomUUID(), name: input.name?.trim() || "artifact", mime: input.mime?.trim() || "text/plain", content: input.content, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  await fs.writeFile(path.join(dir, `${record.id}.json`), JSON.stringify(record, null, 2), "utf8");
  return record;
}

export async function artifactList(workdir: string) {
  const dir = path.join(workdir, ".roxan", "artifacts");
  await fs.mkdir(dir, { recursive: true });
  const names = await fs.readdir(dir);
  const out: ArtifactRecord[] = [];
  for (const name of names.filter((n) => n.endsWith(".json"))) {
    try { out.push(JSON.parse(await fs.readFile(path.join(dir, name), "utf8"))); } catch {}
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
}
