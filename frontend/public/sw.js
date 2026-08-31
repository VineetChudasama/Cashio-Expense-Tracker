/* ==========================================================================
   Cashio Smart Finance - Service Worker (Web Push & PWA Support)
   ========================================================================== */

const CACHE_NAME = 'cashio-cache-v1';

// Install event - activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/**
 * Handle incoming Web Push Notifications
 * Triggers even when the website/PWA is closed or in the background
 */
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Cashio Finance',
    body: 'You have a new update from Cashio.',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: `cashio-${Date.now()}`,
    data: {
      url: '/dashboard',
      type: 'SYSTEM'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
        data: {
          ...notificationData.data,
          ...(payload.data || {})
        }
      };
    } catch (err) {
      // If payload is plain text string
      try {
        notificationData.body = event.data.text();
      } catch (textErr) {
        console.warn('[SW PUSH ERROR]: Failed to parse payload', err);
      }
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || '/logo.png',
    badge: notificationData.badge || '/logo.png',
    tag: notificationData.tag || 'cashio-notification',
    data: notificationData.data || { url: '/dashboard' },
    renotify: false,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: notificationData.actions && notificationData.actions.length > 0 
      ? notificationData.actions 
      : [
          { action: 'open', title: 'Open Cashio' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

/**
 * Handle Notification Click Behavior
 * Focuses existing Cashio tab or opens a new window, navigating to relevant route
 */
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  const targetUrl = notification.data?.url || '/dashboard';
  const fullTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if an existing Cashio window/tab is already open
      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(fullTargetUrl);
          }
          return client.focus();
        }
      }

      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullTargetUrl);
      }
    })
  );
});

/**
 * Handle Push Subscription Change (Browser Key Rotation)
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe(event.oldSubscription.options).then((newSubscription) => {
      // Send refreshed subscription to the backend
      return fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(newSubscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(newSubscription.getKey('auth'))))
          }
        })
      });
    }).catch(err => {
      console.error('[SW PUSH SUBSCRIPTION CHANGE ERROR]:', err);
    })
  );
});
