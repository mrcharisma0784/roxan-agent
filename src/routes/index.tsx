import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat/chat-view";

export const Route = createFileRoute("/")({
  component: ChatPage,
});

function ChatPage() {
  return <ChatView />;
}
