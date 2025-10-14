// frontend/sw.js
const CACHE_NAME = "svpos-cache-v4";
const CORE_ASSETS = [
  "index.html",
  "../summary.html",
  "../receipt.html",
  "app.js",
  "catalog.js",
  "cart.js",
  "orders.js",
  "money.js",
  "summary.js",
  "assets/items.json", // ensure this file actually exists at this path
];

// Install: cache assets individually; skip any that fail
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const url of CORE_ASSETS) {
        try {
          const res = await fetch(url, { cache: "no-cache" });
          if (res.ok) await cache.put(url, res.clone());
          else console.warn("[SW] skip (status)", url, res.status);
        } catch (e) {
          console.warn("[SW] skip (fetch)", url, e.message);
        }
      }
      await self.skipWaiting();
    })()
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch: same‑origin only, with strategies
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.endsWith("/src/assets/items.json") ||
    url.pathname.endsWith("/assets/items.json")
  ) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  const shellSet = new Set(CORE_ASSETS.map((p) => "/" + p));
  if (
    req.method === "GET" &&
    (shellSet.has(url.pathname) ||
      req.destination === "document" ||
      req.destination === "script" ||
      req.destination === "style")
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

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
  const fetchPromise = fetch(req)
    .then((res) => {
      cache.put(req, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
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
