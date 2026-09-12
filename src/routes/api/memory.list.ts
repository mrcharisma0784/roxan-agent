import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/memory/list")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handleMemoryList } = await import("@/lib/cf-ai.server");
        return handleMemoryList(request);
      },
    },
  },
});
