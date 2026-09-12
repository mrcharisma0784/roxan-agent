import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/project")({ server: { handlers: { GET: async ({ request }) => { const { handleProject } = await import("@/lib/project.server"); return handleProject(request); } } } });
