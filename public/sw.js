// Minimal service worker: makes the app installable and shows a friendly page when offline.
// Nothing user-specific is cached; all data comes from the server.
//
// v2: only take over page loads when the device is offline. While online the browser loads
// pages itself. Intercepting every navigation (including login redirects) is what Safari's
// installed-app mode handles badly, and could leave a blank screen on resume.
const CACHE = "fitness-shell-v2";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate" || self.navigator.onLine) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
