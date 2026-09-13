import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type CheckpointMeta = { id: string; label: string; createdAt: string };
function rootDir(workdir: string) { return path.join(workdir, ".roxan", "checkpoints"); }
async function snapshot(workdir: string, destination: string) {
  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(workdir, { withFileTypes: true })) {
    if ([".roxan", "output", "node_modules", ".git"].includes(entry.name)) continue;
    await fs.cp(path.join(workdir, entry.name), path.join(destination, entry.name), { recursive: true, force: true });
  }
}
export async function workspaceCheckpointCreate(workdir: string, label = "Checkpoint") {
  const root = rootDir(workdir); await fs.mkdir(root, { recursive: true });
  const meta: CheckpointMeta = { id: `${Date.now()}-${randomUUID().slice(0, 8)}`, label, createdAt: new Date().toISOString() };
  const dir = path.join(root, meta.id); await snapshot(workdir, dir); await fs.writeFile(path.join(dir, "checkpoint.json"), JSON.stringify(meta), "utf8");
  return { ok: true, checkpoint: meta };
}
export async function workspaceCheckpointList(workdir: string) {
  const root = rootDir(workdir); await fs.mkdir(root, { recursive: true }); const out: CheckpointMeta[] = [];
  for (const e of (await fs.readdir(root, { withFileTypes: true })).filter((e) => e.isDirectory()).slice(-30).reverse()) { try { out.push(JSON.parse(await fs.readFile(path.join(root, e.name, "checkpoint.json"), "utf8"))); } catch {} }
  return { ok: true, checkpoints: out };
}
export async function workspaceCheckpointRestore(workdir: string, checkpointId: string) {
  const root = rootDir(workdir); const dir = path.resolve(root, checkpointId); if (!dir.startsWith(`${root}${path.sep}`)) return { ok: false, error: "Geçersiz checkpoint yolu." };
  try { await fs.access(path.join(dir, "checkpoint.json")); } catch { return { ok: false, error: `Checkpoint bulunamadı: ${checkpointId}` }; }
  for (const e of await fs.readdir(workdir, { withFileTypes: true })) { if ([".roxan", "output", "node_modules", ".git"].includes(e.name)) continue; await fs.rm(path.join(workdir, e.name), { recursive: true, force: true }); }
  for (const e of await fs.readdir(dir, { withFileTypes: true })) { if (e.name === "checkpoint.json") continue; await fs.cp(path.join(dir, e.name), path.join(workdir, e.name), { recursive: true, force: true }); }
  return { ok: true, checkpointId };
}
