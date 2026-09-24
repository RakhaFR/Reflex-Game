// Service Worker for ReflexRHYTHM PWA
const CACHE_NAME = "reflex-rhythm-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Pass through fetch for network-first strategy on dynamic Next.js routes
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
