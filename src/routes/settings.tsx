import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SettingsForm } from "@/components/settings/settings-form";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <SettingsForm />
    </div>
  );
}
