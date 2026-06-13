// ═══════════════════════════════════════════════════════════════════
// MY ATHLETIC JOURNEY — Service Worker
// Power2ADAPT · PWA Offline Support
// Version: update this string whenever you deploy a new version
// ═══════════════════════════════════════════════════════════════════

const CACHE_NAME = 'maj-v2.10';
const STATIC_CACHE = 'maj-static-v2.10';
const API_CACHE = 'maj-api-v2.10';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/my-athletic-journey',
  '/my-athletic-journey/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap'
];

// API routes that should NOT be cached (always fetch fresh)
const API_ROUTES = [
  '/api/maj/login',
  '/api/maj/athlete',
  '/api/maj/reflection',
  '/api/maj/badge'
];

// ── INSTALL ────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        // Don't fail install if some assets can't be cached
        console.warn('MAJ SW: Some assets could not be cached', err);
      });
    }).then(() => {
      // Activate immediately without waiting
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ───────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== API_CACHE)
          .map(name => {
            console.log('MAJ SW: Clearing old cache', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ── FETCH ──────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  // Never intercept non-GET requests (POST/PUT/PATCH/DELETE must go straight to the network)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-first for ALL /api/ GET requests — never serve stale API data
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Network unavailable — return a friendly offline JSON response
        return new Response(
          JSON.stringify({ error: 'offline', message: 'No connection — your progress will sync when you reconnect.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // For Google Fonts — cache first, network fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // For the main app HTML — network first, cache fallback
  // This ensures athletes always get the latest content
  if (url.pathname === '/my-athletic-journey' || url.pathname === '/my-athletic-journey/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh version — clone BEFORE the body is consumed by the return
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, copy);
          });
          return response;
        })
        .catch(() => {
          // Network failed — serve cached version
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // Last resort offline page
            return new Response(
              `<!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>My Athletic Journey — Offline</title>
                <style>
                  body { background: #0a0a0a; color: #fff; font-family: sans-serif;
                    display: flex; flex-direction: column; align-items: center;
                    justify-content: center; min-height: 100vh; text-align: center; padding: 20px; }
                  .logo { color: #F26522; font-size: 13px; letter-spacing: 3px;
                    text-transform: uppercase; margin-bottom: 12px; }
                  h1 { font-size: 32px; margin-bottom: 8px; }
                  p { color: #888; font-size: 14px; line-height: 1.7; max-width: 280px; }
                  .dot { width: 8px; height: 8px; background: #F26522; border-radius: 50%;
                    display: inline-block; animation: pulse 1.5s infinite; margin: 20px 4px 0; }
                  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
                </style>
              </head>
              <body>
                <div class="logo">Power2ADAPT</div>
                <h1>My Athletic Journey</h1>
                <p>You are offline right now. Connect to the internet and reload to continue your journey.</p>
                <div class="dot" style="animation-delay:0s"></div>
                <div class="dot" style="animation-delay:0.3s"></div>
                <div class="dot" style="animation-delay:0.6s"></div>
              </body>
              </html>`,
              { status: 200, headers: { 'Content-Type': 'text/html' } }
            );
          });
        })
    );
    return;
  }

  // All other requests — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          // Clone BEFORE returning — the async cache write must not touch a consumed body
          const copy = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(() => caches.match('/my-athletic-journey'));
    })
  );
});

// ── BACKGROUND SYNC ────────────────────────────────────────────────
// Retries failed progress saves when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncQueuedProgress());
  }
});

async function syncQueuedProgress() {
  // This will be implemented with IndexedDB queue in a future update
  console.log('MAJ SW: Syncing queued progress...');
}

// ── PUSH NOTIFICATIONS ─────────────────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'My Athletic Journey', {
      body: data.body || 'You have a new update!',
      icon: './maj-icon-180.png',
      badge: './maj-icon-180.png',
      data: { url: data.url || '/my-athletic-journey' },
      vibrate: [200, 100, 200]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/my-athletic-journey';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus an existing open window if one exists
      for (const client of windowClients) {
        if (client.url.includes('/my-athletic-journey') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
