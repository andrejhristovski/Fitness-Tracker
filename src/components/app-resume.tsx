"use client";

import { useEffect } from "react";

/** Reload when coming back after this long in the background (fresh data, fresh code). */
const STALE_AFTER_MS = 10 * 60 * 1000;
const RELOAD_FLAG = "fitness-reloaded-for-error";

/** Errors that mean the page is running old code the server no longer has (after a deploy). */
const STALE_CODE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|Failed to find Server Action|error loading dynamically imported module/i;

function readFlag() {
  try {
    return sessionStorage.getItem(RELOAD_FLAG);
  } catch {
    return null;
  }
}

function writeFlag(value: string | null) {
  try {
    if (value == null) sessionStorage.removeItem(RELOAD_FLAG);
    else sessionStorage.setItem(RELOAD_FLAG, value);
  } catch {
    // Storage unavailable (private mode): just skip the guard.
  }
}

/**
 * Keeps the installed iPhone/Android app from showing a blank or stale screen:
 * - iOS can resume an old copy of the page from memory (bfcache) → reload it.
 * - back after a long time in the background → reload (new data, and new code after a deploy).
 * - the page asks for code files that no longer exist after a deploy → reload once.
 */
export function AppResume() {
  useEffect(() => {
    let hiddenAt = 0;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > STALE_AFTER_MS) location.reload();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) location.reload();
    };
    const reloadOnce = (message: string) => {
      if (!STALE_CODE.test(message) || readFlag()) return;
      writeFlag("1");
      location.reload();
    };
    const onError = (e: ErrorEvent) => reloadOnce(`${e.message} ${e.error?.name ?? ""}`);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string; message?: string } | undefined;
      reloadOnce(`${r?.name ?? ""} ${r?.message ?? String(e.reason)}`);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    // The page loaded fine: allow another one-time recovery reload later.
    const clear = setTimeout(() => writeFlag(null), 10_000);

    return () => {
      clearTimeout(clear);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
