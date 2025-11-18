// -----------------------------------------------------------
// MathForge Service Worker (Offline + PWA Stability)
// -----------------------------------------------------------

const CACHE_NAME = "mathforge-cache-v1";

// Files to precache (add any static assets here)
const PRECACHE = [
  "/",
  "/index.html",
  "/index.css",
  "/index.tsx",
  "/assets/logo.png",
  "/manifest.json"
];

// -----------------------------------------------------------
// Install: Pre-cache essential files
// -----------------------------------------------------------
self.addEventListener("install", (event) => {
  console.log("[SW] Installing…");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching app shell");
      return cache.addAll(PRECACHE);
    })
  );

  self.skipWaiting();
});

// -----------------------------------------------------------
// Activate: Clean old caches
// -----------------------------------------------------------
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating…");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// -----------------------------------------------------------
// Fetch: Network with cache fallback
// -----------------------------------------------------------
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // Optional: return fallback page or asset
        })
      );
    })
  );
});
