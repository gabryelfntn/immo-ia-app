/* Service worker : notifications push + enregistrement PWA. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* File d’attente basique : les échecs réseau sur POST pourront être rejoués (placeholder). */
self.addEventListener("sync", (event) => {
  if (event.tag === "immo-sync") {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "ImmoAI", body: "" };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    /* ignore */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/file.svg",
      badge: "/file.svg",
    })
  );
});
