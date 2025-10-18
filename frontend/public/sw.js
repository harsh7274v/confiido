// Minimal service worker to prevent 404 errors
// This doesn't actually do anything but stops the browser from requesting it

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// No fetch handler - just a placeholder
