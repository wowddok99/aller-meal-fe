import { AppHeader } from "@/components/app-header";
import { EditNavigationProvider } from "./edit-navigation-guard";

export function MemberShell({ children }: { children: React.ReactNode }) {
  return (
    <EditNavigationProvider><main className="min-h-[100dvh] overflow-x-hidden bg-[#f4f6f8] text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <AppHeader />
      {children}
    </main></EditNavigationProvider>
  );
}
