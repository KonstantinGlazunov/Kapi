const CACHE = "capy-count-v36";
const ASSETS = ["./", "index.html", "styles.css", "kapi.js", "app.js", "manifest.webmanifest", "manifest-ru.webmanifest", "manifest-de.webmanifest", "favicon.svg", "icon-192.png", "icon-512.png", "assets/capybara.webp", "assets/kapi-welcome-sprite.webp", "assets/kapi-flag.webp", "assets/kapi-party.webp", "assets/kapi-dance.webp", "assets/kapi-handshake.webp", "assets/kapi-rig-v2/head.png", "assets/kapi-rig-v2/torso.png", "assets/kapi-rig-v2/arm-left-upper.png", "assets/kapi-rig-v2/arm-left-lower.png", "assets/kapi-rig-v2/arm-right-upper.png", "assets/kapi-rig-v2/arm-right-lower.png", "assets/kapi-rig-v2/leg-left.png", "assets/kapi-rig-v2/leg-right.png", "assets/kapi-rig-v2/foot-left.png", "assets/kapi-rig-v2/foot-right.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
