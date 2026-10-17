/** Shown instantly while a tab's data loads (if it wasn't prefetched yet). */
export default function AppLoading() {
  const block = "animate-pulse rounded-2xl bg-[var(--card)]";
  return (
    <div className="mx-auto max-w-4xl space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-[var(--card)]" />
        <div className="h-10 w-36 animate-pulse rounded-xl bg-[var(--card)]" />
      </div>
      <div className={`${block} h-44`} />
      <div className="grid grid-cols-2 gap-3">
        <div className={`${block} h-20`} />
        <div className={`${block} h-20`} />
      </div>
      <div className={`${block} h-24`} />
      <div className={`${block} h-24`} />
    </div>
  );
}
