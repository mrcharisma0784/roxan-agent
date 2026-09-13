import { promises as fs } from "node:fs";
import path from "node:path";
import { unzipSync, zipSync } from "fflate";

const EXCLUDED = new Set(["node_modules", ".git", "output"]);

function safeRelative(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === "..")) {
    throw new Error("Arşiv yolu workspace dışına çıkamaz.");
  }
  return normalized;
}

async function collectFiles(root: string, current: string, entries: Record<string, Uint8Array>) {
  for (const entry of await fs.readdir(current, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name) || entry.name.startsWith(".")) continue;
    const absolute = path.join(current, entry.name);
    const relative = safeRelative(path.relative(root, absolute));
    if (entry.isDirectory()) await collectFiles(root, absolute, entries);
    else if (entry.isFile()) entries[relative] = new Uint8Array(await fs.readFile(absolute));
  }
}

export async function createZipFromDirectory(root: string) {
  const entries: Record<string, Uint8Array> = {};
  await collectFiles(root, root, entries);
  if (Object.keys(entries).length === 0) entries[".roxan-empty"] = new TextEncoder().encode("Empty workspace");
  return zipSync(entries, { level: 6 });
}

export async function writeZipFromDirectory(root: string, destination: string) {
  const data = await createZipFromDirectory(root);
  await fs.writeFile(destination, data);
  return data;
}

export async function extractZipFile(archivePath: string, destination: string) {
  const files = unzipSync(new Uint8Array(await fs.readFile(archivePath)));
  let count = 0;
  for (const [rawName, data] of Object.entries(files)) {
    const name = safeRelative(rawName);
    if (!name || name === ".roxan-empty") continue;
    const target = path.resolve(destination, name);
    const root = path.resolve(destination);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error("ZIP içeriği workspace dışına çıkamaz.");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    count += 1;
  }
  return count;
}

export function sanitizeArchiveName(input: string, fallback = "roxan-project") {
  const base = input.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/\.zip$/i, "");
  return `${base || fallback}.zip`;
}
