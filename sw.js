// sw.js - Basic Service Worker

const CACHE_NAME = 'gst-billing-app-v1';
const urlsToCache = [
    'index.html',
    'app.js',
    'manifest.json',
    'styles/animations.css',
    // Add paths to your component HTML, JS, CSS files
    'components/sales/sales.html',
    'components/sales/sales.js',
    'components/sales/sales.css',
    'components/purchases/purchases.html',
    'components/purchases/purchases.js',
    'components/purchases/purchases.css',
    // ... add all other components ...
    // Add paths to your icons
    'icons/icon-192x192.png',
    'icons/icon-512x512.png'
    // Add Tailwind CSS CDN if you want to cache it (can be tricky with CDNs)
    // 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'
];

// Install event: cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' }))); // Force reload from network for caching
            })
            .catch(err => {
                console.error('Failed to cache during install:', err);
            })
    );
    self.skipWaiting(); // Activate the new service worker immediately
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control of all open clients
});

// Fetch event: serve cached assets if available, otherwise fetch from network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                // Not in cache - fetch from network
                return fetch(event.request).then(
                    networkResponse => {
                        // Check if we received a valid response
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            // Don't cache opaque responses (like from CDNs without CORS) unless you intend to
                            return networkResponse;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and because we want the browser to consume the response
                        // as well as the cache consuming the response, we need
                        // to clone it so we have two streams.
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Fetch failed; returning offline page instead.', error);
                    // Optionally, return a fallback offline page:
                    // return caches.match('/offline.html');
                });
            })
    );
});