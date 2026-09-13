type Role = "user" | "assistant" | "system";
export type ContextMessage = { role: Role; content: string | { type: "text" | "image_url"; text?: string; image_url?: { url: string } }[] };

function textOf(content: ContextMessage["content"]): string {
  return typeof content === "string" ? content : content.map((part) => part.type === "text" ? part.text || "" : "[görsel]").join(" ");
}

export function buildContext(options: {
  systemPrompt: string;
  messages: ContextMessage[];
  workspaceMemory?: string;
  workspaceInstructions?: string;
  attachmentSummary?: string;
  maxMessages?: number;
  maxChars?: number;
}): ContextMessage[] {
  const maxChars = options.maxChars ?? 70000;
  const maxMessages = options.maxMessages ?? 24;
  const systemParts = [options.systemPrompt];
  if (options.workspaceInstructions) systemParts.push(`Workspace talimatları:\n${options.workspaceInstructions}`);
  if (options.workspaceMemory) systemParts.push(`Workspace hafızası:\n${options.workspaceMemory}`);
  if (options.attachmentSummary) systemParts.push(`Ekler:\n${options.attachmentSummary}`);
  const result: ContextMessage[] = [{ role: "system", content: systemParts.join("\n\n") }];
  let chars = result[0].content.length;
  for (const message of options.messages.slice(-maxMessages)) {
    const length = textOf(message.content).length;
    if (chars + length > maxChars && result.length > 1) break;
    result.push(message);
    chars += length;
  }
  return result;
}
