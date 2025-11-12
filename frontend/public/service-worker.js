// PriceMon Service Worker
// Minimal service worker for PWA installation support
// Does NOT cache or interfere with app functionality

const CACHE_NAME = 'pricemon-v1';

// Install event - service worker is being installed
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - service worker is now active
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event - intercept network requests
// Currently just passes through all requests without caching
self.addEventListener('fetch', (event) => {
  // Pass through - don't interfere with requests
  // This keeps your app working exactly as before
  event.respondWith(fetch(event.request));
});
