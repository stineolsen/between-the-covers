import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

// injectManifest (unlike generateSW) doesn't auto-add activation-forcing
// logic, so without this a new SW installs but sits in "waiting" until every
// tab is fully closed - on iOS Safari/PWA that can mean never, leaving
// returning users running JS from before the last deploy indefinitely.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification handling — payloads are sent from
// backend/src/utils/pushService.js, triggered by new books / list shares /
// list comments (see backend/src/utils/emailService.js).
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Between The Covers", {
      body: data.body,
      icon: "/pwa-192.png",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
