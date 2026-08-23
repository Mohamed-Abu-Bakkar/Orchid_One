const CACHE_NAME = 'orchid-hrm-v1';
const PRECACHE_URLS = [
  '/index.html',
  '/css/design-system.css',
  '/css/web.css',
  '/js/icons.js',
  '/js/data.js',
  '/js/web.js',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/android/launchericon-192x192.png',
  '/assets/android/launchericon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});