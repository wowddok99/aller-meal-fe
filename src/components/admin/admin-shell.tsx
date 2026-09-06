import { AppHeader } from "@/components/app-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-zinc-50 text-zinc-950 dark:bg-canvas dark:text-zinc-50">
      <AppHeader />
      {children}
    </main>
  );
}
