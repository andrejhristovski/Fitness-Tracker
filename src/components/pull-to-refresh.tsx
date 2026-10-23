"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // px of (damped) pull needed to refresh
const MAX_PULL = 110;

/**
 * Pull down at the top of a page to reload it, like a native app. Installed iPhone apps
 * don't have this built in. Touch only; ignored inside dialogs and while dragging foods.
 */
export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);

  useEffect(() => {
    let startY: number | null = null;

    const blocked = (target: EventTarget | null) =>
      document.documentElement.dataset.dragging === "1" ||
      (target instanceof Element && !!target.closest('[role="dialog"], input, textarea, select'));

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || window.scrollY > 0 || blocked(e.target)) return;
      startY = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY == null) return;
      if (document.documentElement.dataset.dragging === "1") {
        startY = null;
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const dy = e.touches[0].clientY - startY;
      if (dy <= 0 || window.scrollY > 0) {
        if (pullRef.current) {
          pullRef.current = 0;
          setPull(0);
        }
        return;
      }
      e.preventDefault(); // we're handling this pull; don't scroll/bounce the page
      const next = Math.min(dy * 0.5, MAX_PULL);
      pullRef.current = next;
      setPull(next);
    };
    const onEnd = () => {
      if (startY == null) return;
      startY = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        location.reload();
      } else {
        pullRef.current = 0;
        setPull(0);
      }
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  if (!pull && !refreshing) return null;
  const ready = pull >= THRESHOLD;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center pt-[env(safe-area-inset-top)]"
      style={{ transform: `translateY(${pull - 44}px)`, transition: refreshing ? "transform 150ms" : undefined }}
      aria-live="polite"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-lg ${
          ready ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${(pull / THRESHOLD) * 180}deg)` }}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {refreshing ? <path d="M21 12a9 9 0 1 1-6.2-8.6" /> : <path d="M12 5v14M6 13l6 6 6-6" />}
        </svg>
        <span className="sr-only">{refreshing ? "Refreshing" : ready ? "Release to refresh" : "Pull to refresh"}</span>
      </div>
    </div>
  );
}
