import * as React from "react";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useRoxan } from "@/store/roxan";

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    const finish = () => useRoxan.getState().markHydrated();
    void Promise.resolve(useRoxan.persist.rehydrate()).then(finish, finish);
  }, []);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex h-dvh flex-col overflow-hidden bg-bg text-fg">
        <Header />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            className:
              "!bg-bg-elevated !text-fg !border-border !shadow-border !rounded-xl !text-sm",
          }}
        />
      </div>
    </TooltipProvider>
  );
}
