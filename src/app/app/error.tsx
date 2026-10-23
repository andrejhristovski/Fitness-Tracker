"use client";

import { useEffect } from "react";

/** Shown instead of a blank page when an app screen fails to load. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center gap-3 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-sm text-[var(--muted)]">This screen didn&apos;t load. Your data is safe.</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => location.reload()}
          className="rounded-xl bg-[var(--accent)] px-5 py-3 font-semibold text-[var(--on-accent)] hover:bg-[var(--accent-hover)]"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-[var(--border)] px-5 py-3 font-semibold hover:bg-[var(--card-hover)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
