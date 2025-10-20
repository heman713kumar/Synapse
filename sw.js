// sw.js

const CACHE_NAME = 'synapse-cache-v13'; // Incremented cache version

// Using absolute paths to match the deployment sub-path.
const APP_SHELL_URLS = [
  '/Synapse/',
  '/Synapse/index.html',
  '/Synapse/manifest.json',
  '/Synapse/vite.svg',
  // Add paths to your actual icons/screenshots if you want them cached immediately
  '/Synapse/icons/icon-192.png',
  '/Synapse/icons/icon-512.png',
  // Add other essential CSS/JS assets if known beforehand (Vite usually handles this via fetch)
];

self.addEventListener('install', event => {
  console.log('Service Worker: Install event');
  // Ensure the service worker takes control immediately if possible
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Use addAll with error catching for individual asset failures
        return cache.addAll(APP_SHELL_URLS).catch(error => {
           console.error('Service Worker: Failed to cache some app shell URLs:', error);
           // Even if some assets fail, the SW install might proceed
        });
      })
      .catch(error => {
        console.error('Service Worker: Cache open/addAll failed', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activate event');
  // Ensure the activated service worker takes control of the page immediately
  event.waitUntil(clients.claim());

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete caches that start with 'synapse-cache-' but are not the current version
            return cacheName.startsWith('synapse-cache-') && cacheName !== CACHE_NAME;
          })
          .map(cacheName => {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // --- Navigation requests: Network-first, fallback to cache (offline page) ---
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
           // Optional: Cache successful navigation responses if needed
           // const responseClone = networkResponse.clone();
           // caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
           return networkResponse;
         })
        .catch(async () => {
          // Network failed, try to return the cached index.html (offline fallback)
          console.log('Service Worker: Network fetch failed for navigation, serving cached index.html');
          const cache = await caches.open(CACHE_NAME);
          // Match the main entry point
          const cachedResponse = await cache.match('/Synapse/index.html');
          return cachedResponse || Response.error(); // Return error if index isn't cached
        })
    );
    return; // Don't execute further code for navigation requests
  }

  // --- Other requests (assets, API calls etc.): Cache-first, fallback to network ---
  // Ignore API calls or other specific paths if they shouldn't be cached
   if (request.url.includes('/api/')) {
      // Don't cache API calls, always fetch from network
      event.respondWith(fetch(request));
      return;
   }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      // 1. Try to find the response in the cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // console.log('Service Worker: Serving from cache:', request.url);
        return cachedResponse;
      }

      // 2. If not in cache, fetch from the network
      // console.log('Service Worker: Fetching from network:', request.url);
      try {
         const networkResponse = await fetch(request);
         // 3. If fetch is successful, clone it and cache it
         if (networkResponse && networkResponse.ok) {
             // Check if it's a type of response we should cache (e.g., ignore opaque responses)
             if (networkResponse.type === 'basic' || request.url.startsWith(self.location.origin)) {
                 const responseClone = networkResponse.clone();
                 // console.log('Service Worker: Caching network response:', request.url);
                 cache.put(request, responseClone);
             }
         }
         return networkResponse;
      } catch (error) {
          console.error('Service Worker: Network fetch failed, and not in cache:', request.url, error);
          // Optional: Return a custom offline response for assets if needed
          // For example, return a placeholder image if an image fetch fails offline
          // if (request.destination === 'image') {
          //    return cache.match('/Synapse/placeholder-image.png');
          // }
          return Response.error(); // Generic error response
      }
    })
  );
});