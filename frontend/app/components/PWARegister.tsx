'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);

          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60000);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 New Service Worker found, installing...');

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('✅ New version available! Activating...');
                  
                  // Tell the service worker to skip waiting
                  newWorker.postMessage({ type: 'SKIP_WAITING' });

                  // Show update notification (optional)
                  if (confirm('A new version of Confiido is available. Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Handle controller change (when new SW takes over)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 New Service Worker activated, reloading...');
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('📢 Service Worker updated to version:', event.data.version);
        }
      });

      // Clear old caches on logout
      window.addEventListener('storage', (e) => {
        if (e.key === 'token' && e.oldValue && !e.newValue) {
          // Token was removed (logout)
          console.log('🗑️ User logged out, clearing service worker caches...');
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
          }
        }
      });
    }
  }, []);

  return null;
}
