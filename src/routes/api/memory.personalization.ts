import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/memory/personalization")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { handlePersonalization } = await import("@/lib/cf-ai.server");
        return handlePersonalization(request);
      },
    },
  },
});
