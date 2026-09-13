import { promises as fs } from "node:fs";
import path from "node:path";
import { createZipFromDirectory, sanitizeArchiveName } from "@/lib/archive.server";

function workspace(workspaceId = "default") { const safeId = workspaceId.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "default"; return path.join(process.env.ROXAN_WORKSPACES_ROOT || path.join(process.env.TMPDIR || process.env.TMP || "/tmp", "roxan-workspaces"), safeId); }
async function walk(root: string, current: string, result: { path: string; type: "file" | "dir" }[]) { for (const entry of await fs.readdir(current, { withFileTypes: true })) { if (entry.name.startsWith(".") || entry.name === "node_modules") continue; const absolute = path.join(current, entry.name); const relative = path.relative(root, absolute); result.push({ path: relative, type: entry.isDirectory() ? "dir" : "file" }); if (entry.isDirectory()) await walk(root, absolute, result); } }
export async function handleProject(request: Request) {
  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId") || "default";
  let root = workspace(workspaceId);
  await fs.mkdir(root, { recursive: true });
  const method = request.method.toUpperCase();
  if (method === "POST") {
    const body = (await request.json().catch(() => ({}))) as { action?: string; checkpointId?: string; label?: string };
    const { workspaceCheckpointCreate, workspaceCheckpointRestore, workspaceCheckpointList } = await import("@/lib/workspace-checkpoints.server");
    if (body.action === "checkpoint-create") return Response.json(await workspaceCheckpointCreate(root, body.label || "Manual checkpoint"));
    if (body.action === "checkpoint-restore") return Response.json(await workspaceCheckpointRestore(root, body.checkpointId || ""));
    if (body.action === "checkpoint-list") return Response.json(await workspaceCheckpointList(root));
    return Response.json({ ok: false, error: "Bilinmeyen proje işlemi." }, { status: 400 });
  }
  if (url.searchParams.get("checkpoints") === "1") {
    const { workspaceCheckpointList } = await import("@/lib/workspace-checkpoints.server");
    return Response.json(await workspaceCheckpointList(root));
  }
  if (url.searchParams.get("download") === "1") { const filename = sanitizeArchiveName(url.searchParams.get("filename") || "roxan-project.zip"); const data = await createZipFromDirectory(root); return new Response(data, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${filename}"`, "Content-Length": String(data.byteLength), "Cache-Control": "no-store" } }); }
  const entries: { path: string; type: "file" | "dir" }[] = []; await walk(root, root, entries); return Response.json({ root, entries: entries.sort((a, b) => a.path.localeCompare(b.path)) });
}
