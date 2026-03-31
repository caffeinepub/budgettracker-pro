const CACHE_NAME = 'wiz-offline-v5';

// Core app-shell assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/uploads/IMG_20260323_010002-1.png',
];

// ─── INSTALL: pre-cache the app shell & skip waiting immediately ─────────────
// skipWaiting() forces the new SW to activate right away without waiting
// for all existing tabs to close.
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

// ─── ACTIVATE: remove stale caches & claim all open tabs ─────────────────────
// clients.claim() makes the new SW take control of all open pages immediately.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH: Cache-First, falling back to network ─────────────────────────────
// Only handles same-origin GET requests for static UI assets.
// Does NOT intercept localStorage, IndexedDB, or any dynamic data.
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only cache GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Only handle same-origin requests (skip API calls, CDN fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip browser-extension and non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // Cache hit — return immediately (offline-first)
      if (cached) return cached;

      // Cache miss — fetch from network and store for next time
      return fetch(request)
        .then((response) => {
          // Only cache valid, successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'error' ||
            response.type === 'opaque'
          ) {
            return response;
          }

          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          return response;
        })
        .catch(() => {
          // Network failed + no cache — return the app shell for navigation
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ─── MESSAGES: explicit skipWaiting trigger + daily reminder scheduling ───────
self.addEventListener('message', (event) => {
  // Allow the app to explicitly trigger skipWaiting (belt-and-suspenders)
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === 'SCHEDULE_DAILY_REMINDER') {
    const lang = event.data.lang || 'en';
    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);
    if (now >= target) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();

    setTimeout(() => {
      const body =
        lang === 'ar'
          ? '\u0644\u0627 \u062a\u0646\u0633\u064e \u062a\u0633\u062c\u064a\u0644 \u0645\u0635\u0627\u0631\u064a\u0641 \u0627\u0644\u064a\u0648\u0645! \uD83C\uDFAF'
          : "Don't forget to track your spending today! \uD83C\uDFAF";
      self.registration.showNotification('WIZ \u2014 Daily Reminder', {
        body,
        icon: '/assets/uploads/IMG_20260323_010002-1.png',
        badge: '/assets/uploads/IMG_20260323_010002-1.png',
        tag: 'daily-reminder',
        renotify: true,
      });
    }, delay);
  }
});

// ─── PERIODIC SYNC: background daily reminder fallback ───────────────────────
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

// ─── NOTIFICATION CLICK: open/focus the app ──────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
  );
});
