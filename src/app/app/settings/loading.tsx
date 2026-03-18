export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-8">
      <div>
        <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--card)]" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-[var(--card)]" />
      </div>
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-4 h-4 w-16 animate-pulse rounded bg-[var(--border)]" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--background)]" />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="mb-4 h-4 w-24 animate-pulse rounded bg-[var(--border)]" />
          <div className="mb-4 h-4 w-64 animate-pulse rounded bg-[var(--border)]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[var(--background)]" />
            ))}
          </div>
        </div>
        <div className="h-12 w-32 animate-pulse rounded-xl bg-[var(--card)]" />
      </div>
    </div>
  );
}
