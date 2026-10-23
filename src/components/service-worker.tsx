"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds (a dev service worker only gets in the way of hot reload). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    // Always re-check sw.js itself so fixes to it reach installed apps quickly.
    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
