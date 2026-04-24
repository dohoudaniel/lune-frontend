/// <reference lib="webworker" />

const CACHE_NAME = "lune-cache-v2";
const RUNTIME_CACHE = "lune-runtime-v2";

// Static assets to cache on install
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Pre-caching static assets");
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log("[ServiceWorker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }),
      );
    }),
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip all cross-origin requests — let browser handle them natively
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests - always fetch fresh
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip Vite dev-server internals — never cache these; hashes change on re-optimization
  if (
    url.pathname.startsWith("/node_modules/.vite/") ||
    url.pathname.startsWith("/@vite/") ||
    url.pathname.startsWith("/@fs/") ||
    url.pathname.startsWith("/src/")
  ) {
    return;
  }

  // Cache First strategy for static assets (js, css, images)
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "image" ||
    STATIC_ASSETS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((response) => {
            if (
              response &&
              response.status === 200 &&
              response.type === "basic"
            ) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return null;
          });
      }),
    );
    return;
  }

  // Network First strategy for other requests (e.g. HTML navigation)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to index.html for navigation requests when offline
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return null;
        });
      }),
  );
});
