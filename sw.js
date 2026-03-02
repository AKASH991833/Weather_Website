/**
 * WeatherNow - Service Worker
 * GitHub Pages Compatible - Relative Paths
 */

const CACHE_NAME = 'weathernow-v10';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './css/components.css',
  './css/responsive.css',
  './css/animations.css',
  './css/ui-enhanced.css',
  './css/animations-enhanced.css',
  './css/responsive-enhanced.css',
  './css/accessibility.css',
  './css/alerts.css',
  './js/main.js',
  './js/api.js',
  './js/ui.js',
  './js/config.js',
  './js/features.js',
  './js/pwa.js',
  './js/animations.js',
  './js/weather-api.js',
  './js/location-api.js',
  './js/location-display.js',
  './js/alerts.js',
  './js/notifications.js',
  './js/advanced-features.js',
  './js/error-boundary.js',
  './manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.error('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // Skip external requests (APIs, CDNs) - use cache-first for CDNs
  if (url.origin !== location.origin) {
    if (url.hostname.includes('googleapis') ||
        url.hostname.includes('jsdelivr') ||
        url.hostname.includes('openweathermap')) {
      event.respondWith(cacheFirstStrategy(event.request));
    }
    return;
  }

  // Network first for our own assets
  event.respondWith(networkFirstStrategy(event.request));
});

// Network First Strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('./index.html');
  }
}

// Cache First Strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for weather data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-weather') {
    event.waitUntil(syncWeatherData());
  }
});

async function syncWeatherData() {
  console.log('[SW] Syncing weather data...');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'Weather update available',
    icon: undefined,
    badge: undefined,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'view', title: 'View Weather' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('WeatherNow', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
