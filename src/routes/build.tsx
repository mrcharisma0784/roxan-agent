import { createFileRoute } from "@tanstack/react-router";
import { BuildView } from "@/components/build/build-view";

export const Route = createFileRoute("/build")({
  component: BuildPage,
});

function BuildPage() {
  return <BuildView />;
}
