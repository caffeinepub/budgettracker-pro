const CACHE_NAME = 'wiz-offline-v2';

// On install: cache everything the app shell needs
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/assets/uploads/IMG_20260323_010002-1.png',
        '/assets/IMG_20260323_010002.png',
      ]);
    })
  );
});

// On activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy for all requests
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDER') {
    const lang = event.data.lang || 'en';
    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();

    setTimeout(() => {
      const msg = lang === 'ar'
        ? '\u0644\u0627 \u062a\u0646\u0633\u064e \u062a\u0633\u062c\u064a\u0644 \u0645\u0635\u0627\u0631\u064a\u0641 \u0627\u0644\u064a\u0648\u0645! \uD83C\uDFAF'
        : "Don't forget to track your spending today! \uD83C\uDFAF";
      self.registration.showNotification('WIZ \u2014 Daily Reminder', {
        body: msg,
        icon: '/assets/uploads/IMG_20260323_010002-1.png',
        badge: '/assets/uploads/IMG_20260323_010002-1.png',
        tag: 'daily-reminder',
        renotify: true,
      });
    }, delay);
  }
});

// Handle Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-expense-reminder') {
    event.waitUntil(
      self.registration.showNotification('WIZ \u2014 Daily Reminder', {
        body: "Don't forget to track your spending today! \uD83C\uDFAF",
        icon: '/assets/uploads/IMG_20260323_010002-1.png',
        tag: 'daily-reminder',
      })
    );
  }
});

// Notification click: open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
