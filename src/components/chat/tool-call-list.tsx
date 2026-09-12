import { ToolCallRow } from "@/components/chat/tool-call-row";
import type { ToolCall } from "@/store/roxan";

export function ToolCallList({ toolCalls }: { toolCalls?: ToolCall[] }) {
  if (!toolCalls || toolCalls.length === 0) return null;
  return (
    <div className="rise-in mb-0.5 flex flex-col gap-px">
      {toolCalls.map((toolCall) => (
        <ToolCallRow key={toolCall.callId} toolCall={toolCall} />
      ))}
    </div>
  );
}
