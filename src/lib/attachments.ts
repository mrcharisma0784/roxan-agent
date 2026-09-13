export type ProcessedAttachment = {
  name: string;
  type: string;
  kind: "file" | "image";
  dataUrl?: string;
  textContent?: string;
  size?: number;
};

const TEXT_EXTENSIONS = /\.(txt|md|markdown|json|csv|tsv|yaml|yml|xml|html|htm|css|js|jsx|ts|tsx|py|java|c|cpp|h|sql|log|ini|toml|sh|bash|zsh|rs|go|rb|php|swift|kt|kts)$/i;

export function isTextAttachment(file: File) {
  return TEXT_EXTENSIONS.test(file.name) || /^text\//i.test(file.type) || /json|javascript|typescript|xml|yaml|csv|markdown/i.test(file.type);
}

export async function processAttachment(file: File, kind: "file" | "image"): Promise<ProcessedAttachment> {
  const base = { name: file.name, type: file.type || "application/octet-stream", kind, size: file.size } as ProcessedAttachment;
  if (kind === "image") return { ...base, dataUrl: await readDataUrl(file) };
  if (isTextAttachment(file)) {
    const text = await file.text();
    return { ...base, textContent: text.slice(0, 120_000), dataUrl: undefined };
  }
  return { ...base, dataUrl: await readDataUrl(file) };
}

export function attachmentPrompt(a: ProcessedAttachment) {
  const meta = `[Ek: ${a.name} | ${a.type} | ${a.size ?? 0} bytes]`;
  return a.textContent ? `${meta}\n${a.textContent}` : meta;
}

function readDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Dosya okunamadı."));
    reader.readAsDataURL(file);
  });
}
