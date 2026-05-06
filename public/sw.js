// public/sw.js — Service Worker pour notifications de rappel en arrière-plan
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

let reminderTimer = null;

function scheduleReminder(timeStr) {
  if (reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
  if (!timeStr) return;
  const [hh, mm] = timeStr.split(":").map(Number);
  const now = new Date();
  const t = new Date();
  t.setHours(hh, mm, 0, 0);
  if (t.getTime() <= now.getTime()) t.setDate(t.getDate() + 1);
  const delay = t.getTime() - now.getTime();
  reminderTimer = setTimeout(() => {
    self.registration.showNotification("Bible Lumière", {
      body: "C'est l'heure de ta lecture quotidienne 🙏",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "daily-reminder",
    });
    scheduleReminder(timeStr); // re-arm
  }, delay);
}

self.addEventListener("message", (event) => {
  const { type, time } = event.data || {};
  if (type === "SCHEDULE_REMINDER") scheduleReminder(time);
  if (type === "CANCEL_REMINDER" && reminderTimer) { clearTimeout(reminderTimer); reminderTimer = null; }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window" }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow("/");
  }));
});
