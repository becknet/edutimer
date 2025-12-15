const CACHE_NAME = "edutimer-cache-v1";
const ASSETS = [
    "/edutimer/",
    "/edutimer/index.html",
    "/edutimer/css/style.css",
    "/edutimer/script/script.js",
    "/edutimer/favicon.png",
    "/edutimer/manifest.json",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request)
                .then((response) => {
                    // Cache same-origin responses for reuse
                    if (
                        response.ok &&
                        new URL(request.url).origin === self.location.origin
                    ) {
                        const respClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, respClone);
                        });
                    }
                    return response;
                })
                .catch(() => cached) // fallback to any cached version if fetch fails
        })
    );
});
