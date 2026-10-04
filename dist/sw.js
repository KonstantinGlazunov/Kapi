const CACHE = "capy-count-v51";
const ASSETS = ["./", "index.html", "styles.css", "kapi.js", "app.js", "manifest.webmanifest", "manifest-ru.webmanifest", "manifest-de.webmanifest", "favicon.svg", "icon-192.png", "icon-512.png", "assets/capybara.webp", "assets/kapi-welcome-sprite.webp", "assets/kapi-flag.webp", "assets/kapi-party.webp", "assets/kapi-dance.webp", "assets/kapi-handshake.webp", "assets/kapi-rig-v2/head.png", "assets/kapi-rig-v2/torso.png", "assets/kapi-rig-v4/arm-left-upper.png", "assets/kapi-rig-v4/arm-left-forearm.png", "assets/kapi-rig-v3/paw-left.png", "assets/kapi-rig-v4/arm-right-upper.png", "assets/kapi-rig-v4/arm-right-forearm.png", "assets/kapi-rig-v3/paw-right.png", "assets/kapi-rig-v3/leg-left.png", "assets/kapi-rig-v3/leg-right.png", "assets/kapi-rig-v3/foot-left.png", "assets/kapi-rig-v3/foot-right.png"];

ASSETS.push("kapi-sound.js", "kapi-motivation.js", "assets/kapi-rig-v2/head-nod.png", "assets/kapi-rig-v2/head-hop.png", "assets/kapi-rig-v2/head-cheer.png", "assets/kapi-rig-v2/head-wrong.png", "assets/kapi-rig-v2/head-recovered.png", "assets/kapi-rig-v2/head-mastered.png", "assets/kapi-rig-v2/head-flag.png", "assets/kapi-rig-v2/head-horn-v2.png", "assets/kapi-rig-v2/arm-right-flag.png", "assets/kapi-rig-v2/head-dance.png", "assets/kapi-rig-v2/head-level.png", "assets/kapi-rig-v2/head-complete.png", "assets/kapi-rig-v2/head-perfect.png");
ASSETS.push("assets/sounds/start.wav", "assets/sounds/correct.wav", "assets/sounds/wrong.wav", "assets/sounds/recovered.wav", "assets/sounds/mastered.wav", "assets/sounds/flag.wav", "assets/sounds/party.wav", "assets/sounds/dance.wav", "assets/sounds/level-up.wav", "assets/sounds/complete-10.wav", "assets/sounds/complete-20.wav", "assets/sounds/complete-30.wav", "assets/sounds/perfect.wav");

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
