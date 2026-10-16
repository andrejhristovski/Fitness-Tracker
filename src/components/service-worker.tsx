"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds (a dev service worker only gets in the way of hot reload). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
