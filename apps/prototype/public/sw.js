/* LifeRoutine PWA — leichter Offline-Cache für Shell */
const CACHE = "liferoutine-shell-v4";
const REMIND_CACHE = "lr-remind-v1";
const REMIND_URL = "/lr-remind-schedule.json";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/brand/logo-full.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== REMIND_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        const hit = list.find((c) => "focus" in c);
        if (hit) return hit.focus();
        return self.clients.openWindow("/");
      }),
  );
});

async function showDueReminders() {
  const cache = await caches.open(REMIND_CACHE);
  const hit = await cache.match(REMIND_URL);
  if (!hit) return;
  const data = await hit.json();
  const items = Array.isArray(data.items) ? data.items : [];
  const now = Date.now();
  let shownId = data.shownId ?? null;
  let changed = false;
  for (const item of items) {
    if (!item || typeof item.id !== "string") continue;
    if (item.at > now) continue;
    if (shownId === item.id) continue;
    const body = typeof item.body === "string" ? item.body : "";
    if (!body) continue;
    await self.registration.showNotification(item.title || "LifeRoutine", {
      body,
      icon: "/icons/icon-192.png",
      tag: `lr-${item.id}`,
    });
    shownId = item.id;
    changed = true;
    break;
  }
  if (changed) {
    await cache.put(
      REMIND_URL,
      new Response(JSON.stringify({ items, shownId }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "lr-remind") {
    event.waitUntil(showDueReminders());
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "lr-check-remind") {
    event.waitUntil(showDueReminders());
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // API immer live
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        if (
          res.ok &&
          (url.pathname.startsWith("/_next/") ||
            url.pathname === "/" ||
            url.pathname.match(/\.(js|css|png|svg|webmanifest)$/))
        ) {
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/"))),
  );
});
