import { requireUser } from "@/lib/session";
import { AppNav, BottomNav } from "@/components/app-nav";
import { TimezoneSync } from "@/components/timezone-sync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen flex flex-col">
      <TimezoneSync />
      {/* Desktop/tablet header. On phones each page's own title acts as the header, and tabs live at the bottom. */}
      <header className="sticky top-0 z-10 hidden border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur sm:block">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold">Fitness Tracker</h1>
          <AppNav />
        </div>
      </header>
      {/* Phones: clear the status bar / notch when installed full-screen. */}
      <div className="h-[env(safe-area-inset-top)] sm:hidden" />
      <main className="flex-1 px-4 pt-5 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:py-6">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
