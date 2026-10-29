/* kapi-runtime:v1 — scope-derived URLs and private caches; consumed by /kapi proxy. */
const CACHE_PREFIX = `kapi:${self.registration.scope}:`;
const CACHE = `${CACHE_PREFIX}v89`;
const SCOPE = new URL(self.registration.scope);
const LEGACY_PREFIX = SCOPE.pathname === "/kapi/" ? "vibe-kapi-capy-count-" : "capy-count-";
const ASSETS = ["./", "index.html", "styles.css", "kapi.js", "app.js", "manifest.webmanifest", "manifest-ru.webmanifest", "manifest-de.webmanifest", "favicon.svg", "icon-192.png", "icon-512.png", "assets/capybara.webp", "assets/kapi-welcome-sprite.webp", "assets/kapi-flag.webp", "assets/kapi-party.webp", "assets/kapi-dance.webp", "assets/kapi-handshake.webp", "assets/kapi-rig-v2/head.png", "assets/kapi-rig-v2/torso.png", "assets/kapi-rig-v4/arm-left-upper.png", "assets/kapi-rig-v4/arm-left-forearm.png", "assets/kapi-rig-v3/paw-left.png", "assets/kapi-rig-v4/arm-right-upper.png", "assets/kapi-rig-v4/arm-right-forearm.png", "assets/kapi-rig-v3/paw-right.png", "assets/kapi-rig-v5/leg-and-paw.png"];

ASSETS.push("kapi-sound.js", "kapi-motivation.js", "assets/kapi-rig-v2/head-nod.png", "assets/kapi-rig-v2/head-hop.png", "assets/kapi-rig-v2/head-cheer.png", "assets/kapi-rig-v2/head-wrong.png", "assets/kapi-rig-v2/head-recovered.png", "assets/kapi-rig-v2/head-mastered.png", "assets/kapi-rig-v2/head-flag.png", "assets/kapi-rig-v2/head-horn-v2.png", "assets/kapi-rig-v2/arm-right-flag.png", "assets/kapi-rig-v2/head-dance.png", "assets/kapi-rig-v2/head-level.png", "assets/kapi-rig-v2/head-complete.png", "assets/kapi-rig-v2/head-perfect.png");
ASSETS.push("kapi-rewards.js", ...["star-badge", "red-cap", "glasses", "scarf", "backpack", "blue-cap", "medal", "crown", "pompom-hat"].map((name) => `assets/cosmetics/${name}.svg`));
ASSETS.push("kapi-guidance.js", "kapi-storage.js", "kapi-tasks.js", "kapi-map.js", "kapi-weekly.js", "kapi-skills.js", "kapi-mastery.js", "kapi-subskills.js", "kapi-session-planner.js");
ASSETS.push("assets/home-world.webp", "assets/home-world-wide.webp");
ASSETS.push("assets/sounds/dance-music.wav", "assets/sounds/start.wav", "assets/sounds/correct.wav", "assets/sounds/wrong.wav", "assets/sounds/recovered.wav", "assets/sounds/mastered.wav", "assets/sounds/flag.wav", "assets/sounds/party.wav", "assets/sounds/dance.wav", "assets/sounds/level-up.wav", "assets/sounds/complete-10.wav", "assets/sounds/complete-20.wav", "assets/sounds/complete-30.wav", "assets/sounds/perfect.wav");

ASSETS.push("assets/journey/forest-route.png", ...["scarf-berry", "scarf-sky", "backpack-stars", "backpack-forest"].map(name => `assets/cosmetics/${name}.svg`));

ASSETS.push(...["river", "mountains", "valley", "coast", "island"].flatMap(name => [0,1,2,3].map(i => `assets/journey/${name}-${i}.webp`)));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
  );
});

// A legacy tab reloads unconditionally on controllerchange. Never force an
// update over another tab unless it acknowledges the safe client protocol.
async function activateFromButton(event) {
  const clients = (await self.clients.matchAll({ type: "window", includeUncontrolled: true }))
    .filter((client) => client.url.startsWith(SCOPE.href));
  const otherClients = clients.filter((client) => client.id !== event.source?.id);
  const compatible = await Promise.all(otherClients.map((client) => new Promise((resolve) => {
    const channel = new MessageChannel();
    const done = (value) => { clearTimeout(timer); channel.port1.close(); resolve(value); };
    const timer = setTimeout(() => done(false), 1500);
    channel.port1.onmessage = (reply) => done(reply.data?.protocol === 1);
    try { client.postMessage({ type: "KAPI_UPDATE_CHECK" }, [channel.port2]); }
    catch { done(false); }
  })));
  if (compatible.every(Boolean)) await self.skipWaiting();
  else event.source?.postMessage({ type: "KAPI_UPDATE_BLOCKED" });
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(activateFromButton(event));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE &&
      (key.startsWith(CACHE_PREFIX) || key.startsWith(LEGACY_PREFIX))).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== SCOPE.origin || !url.pathname.startsWith(SCOPE.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Install links and navigations may contain query parameters; never cache visitor data.
    if (event.request.mode === "navigate") return cache.match(new URL("index.html", SCOPE).href);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    return fetch(event.request);
  })());
});
