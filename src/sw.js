// sw.js
const CACHE_NAME = "svpos-cache-v1";
const CORE_ASSETS = [
  "/", // if served from site root; see note below
  "/index.html",
  "/summary.html",
  "/app.js",
  "/catalog.js",
  "/cart.js",
  "/orders.js",
  "/money.js",
  "/summary.js",
  "/assets/items.json",
  // "https://cdn.tailwindcss.com", // external; some browsers block caching cross-origin, but we keep it here
];

// On install: cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(self.skipWaiting())
  );
});

// On activate: cleanup old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Cache-first for same-origin app shell files
  if (
    req.method === "GET" &&
    new URL(req.url).origin === self.location.origin
  ) {
    if (
      CORE_ASSETS.includes(new URL(req.url).pathname) ||
      req.destination === "document" ||
      req.destination === "script" ||
      req.destination === "style"
    ) {
      event.respondWith(cacheFirst(req));
      return;
    }
  }

  // Stale-while-revalidate for items.json
  if (
    req.url.endsWith("/src/assets/items.json") ||
    req.url.endsWith("/assets/items.json")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Default: network first with fallback to cache
  event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const networkPromise = fetch(req)
    .then((res) => {
      cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || networkPromise;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw new Error("Network and cache both failed");
  }
}
