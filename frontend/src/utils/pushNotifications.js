import { notifications as notificationsApi } from '../lib/api';

/**
 * Converts a base64 string to a Uint8Array for PushManager subscription
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks whether Web Push Notifications and Service Workers are supported in the current environment
 */
export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Detects browser details, operating system, and specific push compatibility requirements
 */
export async function detectBrowserEnvironment() {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      label: 'Unknown Browser',
      isIOS: false,
      isAndroid: false,
      isStandalone: false,
      isSupported: false,
      requiresPwa: false
    };
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  // In-App WebViews (Instagram, FB, TikTok, Twitter/X)
  const isWebView = /(FBAN|FBAV|Instagram|Twitter|ByteLocale|Snapchat|Line)/i.test(ua);

  // Brave detection
  let isBrave = false;
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    try {
      isBrave = await navigator.brave.isBrave();
    } catch {
      isBrave = false;
    }
  }

  // Edge
  const isEdge = /Edg\//.test(ua);
  // Firefox
  const isFirefox = /Firefox\//.test(ua);
  // Opera
  const isOpera = /OPR\//.test(ua);
  // Safari Desktop
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && !isEdge && !isOpera;
  // Chrome / Chromium
  const isChrome = /Chrome\//.test(ua) && !isEdge && !isOpera && !isBrave;

  let name = 'other';
  let label = 'Browser';

  if (isWebView) {
    name = 'webview';
    label = 'In-App Browser';
  } else if (isBrave) {
    name = 'brave';
    label = 'Brave Browser';
  } else if (isEdge) {
    name = 'edge';
    label = 'Microsoft Edge';
  } else if (isFirefox) {
    name = 'firefox';
    label = 'Mozilla Firefox';
  } else if (isOpera) {
    name = 'opera';
    label = 'Opera';
  } else if (isSafari && isIOS) {
    name = 'ios-safari';
    label = 'iOS Safari';
  } else if (isSafari) {
    name = 'safari';
    label = 'Apple Safari';
  } else if (isChrome) {
    name = 'chrome';
    label = 'Google Chrome';
  }

  // iOS Safari requires adding to home screen (PWA) to enable Web Push (iOS 16.4+)
  const requiresPwa = isIOS && !isStandalone;
  const isSupported = isPushNotificationSupported() || (isIOS && !isStandalone);

  return {
    name,
    label,
    isIOS,
    isAndroid,
    isStandalone,
    isSupported,
    requiresPwa,
    isBrave,
    isWebView
  };
}

/**
 * Universal notification permission request (handles promise and callback styles for Safari)
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return new Promise((resolve) => {
      Notification.requestPermission((result) => {
        resolve(result);
      });
    });
  }
}

/**
 * Gets the current notification permission state
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getNotificationPermission() {
  if (!isPushNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Registers the root service worker (/sw.js)
 */
export async function registerServiceWorker() {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    return registration;
  } catch (err) {
    console.error('[SERVICE WORKER REGISTRATION ERROR]:', err);
    throw err;
  }
}

/**
 * Retrieves the existing push subscription from the service worker, if one exists
 */
export async function getExistingPushSubscription() {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (err) {
    console.error('[GET EXISTING PUSH SUBSCRIPTION ERROR]:', err);
    return null;
  }
}

/**
 * Subscribes the current browser to Web Push Notifications and registers with backend
 */
export async function subscribeToPushNotifications() {
  const env = await detectBrowserEnvironment();

  if (env.requiresPwa) {
    throw new Error('On iPhone/iPad, please tap the Share button (⎋ / ↑) and choose "Add to Home Screen" first, then open Cashio from your home screen.');
  }

  if (!isPushNotificationSupported()) {
    throw new Error('Web Push notifications are not supported in this browser window. Please open Cashio in Chrome, Edge, Brave, Firefox, or Safari.');
  }

  // 1. Request permission from the user
  const permission = await requestNotificationPermission();
  if (permission === 'denied') {
    throw new Error('Notification permission was blocked. Please tap the site permissions / lock icon in your address bar and allow notifications.');
  }
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  // 2. Ensure Service Worker is registered and ready
  await registerServiceWorker();
  const registration = await navigator.serviceWorker.ready;

  // 3. Fetch VAPID Public Key from backend or env
  let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    try {
      const res = await notificationsApi.getVapidPublicKey();
      if (res.success && res.data?.publicKey) {
        vapidPublicKey = res.data.publicKey;
      }
    } catch (err) {
      console.warn('[VAPID FETCH WARNING]: Using fallback key', err.message);
      vapidPublicKey = 'BKU_2thwlK44Rovjnm2PrMU30q14G1vm11VV7JPEiVOhfHNnyFSaxIlrZ3zfY9VZKhj_6Ump_5REfOvyVdodeQo';
    }
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // 4. Subscribe with PushManager
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
    } catch (subErr) {
      if (env.isBrave) {
        throw new Error('Brave blocked push services. Please go to brave://settings/privacy, enable "Use Google services for push messaging", and relaunch Brave.');
      }
      throw subErr;
    }
  }

  // 5. Send subscription keys to backend
  const rawKey = subscription.getKey('p256dh');
  const rawAuth = subscription.getKey('auth');

  if (!rawKey || !rawAuth) {
    throw new Error('Failed to retrieve cryptographic keys from push subscription.');
  }

  const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(rawKey)));
  const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(rawAuth)));

  const payload = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh,
      auth
    },
    userAgent: navigator.userAgent
  };

  const response = await notificationsApi.subscribePush(payload);
  return { subscription, response };
}

/**
 * Unsubscribes the current browser from Web Push Notifications
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushNotificationSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await notificationsApi.unsubscribePush({ endpoint });
    } else {
      await notificationsApi.unsubscribePush({});
    }

    return true;
  } catch (err) {
    console.error('[UNSUBSCRIBE ERROR]:', err);
    throw err;
  }
}
