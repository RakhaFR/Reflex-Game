// Service Worker for ReflexRHYTHM PWA
const CACHE_NAME = "reflex-rhythm-v2";

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
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests
  if (req.method !== "GET") return;

  // 2. Bypass media files, audio/video streams, range requests, and external Supabase CDN
  if (
    url.pathname.endsWith(".mp4") ||
    url.pathname.endsWith(".mp3") ||
    url.pathname.endsWith(".webm") ||
    req.headers.has("range") ||
    url.hostname.includes("supabase.co")
  ) {
    return; // Let browser handle natively without Service Worker interception
  }

  // 3. Network-first strategy with guaranteed valid Response fallback
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Guaranteed valid response to prevent "Failed to convert value to 'Response'" error
        return new Response("Offline or resource unavailable", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      })
  );
});
