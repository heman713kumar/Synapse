// sw.js

const CACHE_NAME = 'synapse-cache-v14'; // Incremented cache version again

// Using absolute paths to match the deployment sub-path.
// Ensure index.html and manifest.json are included for the app shell.
const APP_SHELL_URLS = [
  '/Synapse/', // Important for matching the root navigation request
  '/Synapse/index.html',
  '/Synapse/manifest.json',
  // Include essential icons if needed for immediate display
  '/Synapse/icons/icon-192.png',
  '/Synapse/icons/icon-512.png',
  // Add favicon if you want it cached
  '/Synapse/favicon.ico'
];

self.addEventListener('install', event => {
  console.log(`Service Worker (${CACHE_NAME}): Install event`);
  self.skipWaiting(); // Force activation

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Service Worker (${CACHE_NAME}): Caching app shell`);
        return cache.addAll(APP_SHELL_URLS).catch(error => {
           console.error(`Service Worker (${CACHE_NAME}): Failed to cache some app shell URLs:`, error);
        });
      })
      .catch(error => {
        console.error(`Service Worker (${CACHE_NAME}): Cache open/addAll failed`, error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log(`Service Worker (${CACHE_NAME}): Activate event`);
  event.waitUntil(clients.claim()); // Take control immediately

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('synapse-cache-') && cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log(`Service Worker (${CACHE_NAME}): Deleting old cache:`, cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Strategy: Network first for navigation, then cache fallback for offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
           // Optional: Cache successful navigation response if needed for faster subsequent loads
           // Make sure to cache the correct URL (e.g., /Synapse/)
           if (networkResponse.ok) {
               const responseClone = networkResponse.clone();
               caches.open(CACHE_NAME).then(cache => cache.put(request.url, responseClone));
           }
           return networkResponse;
         })
        .catch(async () => {
          // Network failed, try cache for the main index.html
          console.log(`Service Worker (${CACHE_NAME}): Network fetch failed for navigation. Trying cache for /Synapse/index.html`);
          const cache = await caches.open(CACHE_NAME);
          // Explicitly match index.html
          const cachedResponse = await cache.match('/Synapse/index.html');
          if (cachedResponse) {
              return cachedResponse;
          }
          // Fallback if even index.html isn't cached (shouldn't happen after install)
          console.error(`Service Worker (${CACHE_NAME}): Offline fallback page /Synapse/index.html not found in cache.`);
          return new Response("Network error: You appear to be offline and the requested page isn't cached.", { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // Strategy: Cache first, then network fallback for static assets.
  // Ignore API calls.
   if (request.url.includes('/api/')) {
      event.respondWith(fetch(request));
      return;
   }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // Serve from cache
        return cachedResponse;
      }

      // Not in cache, fetch from network
      try {
         const networkResponse = await fetch(request);
         if (networkResponse && networkResponse.ok) {
             // Cache only valid responses from the app's origin or basic types
             if (networkResponse.type === 'basic' || request.url.startsWith(self.location.origin)) {
                 const responseClone = networkResponse.clone();
                 cache.put(request, responseClone);
             }
         }
         return networkResponse;
      } catch (error) {
          console.error(`Service Worker (${CACHE_NAME}): Network fetch failed, not in cache:`, request.url, error);
          return Response.error(); // Generic network error response
      }
    })
  );
});