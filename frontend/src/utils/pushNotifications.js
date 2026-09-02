import { notifications as notificationsApi } from '../lib/api';

/**
 * Converts a base64 string to a Uint8Array for PushManager subscription
 */
export function urlBase64ToUint8Array(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    return new Uint8Array(0);
  }

  // Remove surrounding quotes, whitespace, or carriage returns
  const cleanString = base64String.trim().replace(/^["']|["']$/g, '');
  const padding = '='.repeat((4 - (cleanString.length % 4)) % 4);
  const base64 = (cleanString + padding)
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
  const isSupported = isPushNotificationSupported();

  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      label: 'Unknown Browser',
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      deviceType: 'desktop',
      deviceName: 'Desktop Browser',
      isStandalone: false,
      isSupported: false,
      requiresPwa: false
    };
  }

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const uaDataMobile = navigator.userAgentData?.mobile;

  // iOS Detection (iPhone, iPad, iPod, iPadOS on Safari)
  const isIPhone = /iPhone|iPod/i.test(ua);
  const isIPad = /iPad/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1);
  const isIOS = isIPhone || isIPad;

  // Android Detection (Phone vs Tablet)
  const isAndroid = /Android/i.test(ua);
  const isAndroidPhone = isAndroid && /Mobile/i.test(ua);
  const isAndroidTablet = isAndroid && !/Mobile/i.test(ua);

  // Standalone PWA Detection
  const isStandalone = window.navigator.standalone === true || 
                       (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);

  // In-App WebViews (Instagram, FB, TikTok, Twitter/X, Snapchat, WeChat)
  const isWebView = /(FBAN|FBAV|Instagram|Twitter|ByteLocale|Snapchat|Line|MicroMessenger)/i.test(ua);

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
  const isEdge = /Edg\//i.test(ua);
  // Firefox
  const isFirefox = /Firefox\//i.test(ua);
  // Opera
  const isOpera = /OPR\/|Opera/i.test(ua);
  // Samsung Internet
  const isSamsung = /SamsungBrowser/i.test(ua);
  // Safari Desktop / Mobile
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && !isEdge && !isOpera && !isSamsung;
  // Chrome / Chromium
  const isChrome = /Chrome\//i.test(ua) && !isEdge && !isOpera && !isBrave && !isSamsung;

  let name = 'other';
  let label = 'Browser';

  if (isWebView) {
    name = 'webview';
    label = 'In-App Browser';
  } else if (isBrave) {
    name = 'brave';
    label = 'Brave';
  } else if (isSamsung) {
    name = 'samsung';
    label = 'Samsung Internet';
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
    label = 'Safari';
  } else if (isChrome) {
    name = 'chrome';
    label = 'Google Chrome';
  }

  // Multi-factor Mobile & Tablet Detection
  const isMobilePattern = /Mobile|Android|iP(hone|od|ad)|webOS|BlackBerry|IEMobile|Opera Mini|Windows Phone|Kindle|Silk/i.test(ua);
  const isTouchScreen = maxTouchPoints > 0 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const isNarrowScreen = window.innerWidth <= 840;

  const isMobile = Boolean(
    uaDataMobile || 
    isIOS || 
    isAndroid || 
    isMobilePattern || 
    (isTouchScreen && isNarrowScreen)
  );

  const isTablet = isIPad || isAndroidTablet || (/Tablet/i.test(ua));

  let deviceType = 'desktop';
  if (isTablet) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  }

  // Precise friendly device name
  let deviceBaseName = 'Computer';
  if (isIPhone) {
    deviceBaseName = 'iPhone';
  } else if (isIPad) {
    deviceBaseName = 'iPad';
  } else if (isAndroidPhone) {
    deviceBaseName = 'Android Phone';
  } else if (isAndroidTablet) {
    deviceBaseName = 'Android Tablet';
  } else if (isMobile) {
    deviceBaseName = 'Mobile Device';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceBaseName = 'Mac';
  } else if (/Windows/i.test(ua)) {
    deviceBaseName = 'Windows PC';
  } else if (/Linux/i.test(ua)) {
    deviceBaseName = 'Linux PC';
  }

  const deviceName = `${deviceBaseName} (${label})`;

  // iOS Safari requires adding to home screen (PWA) to enable Web Push (iOS 16.4+)
  const requiresPwa = isIOS && !isStandalone;

  return {
    name,
    label,
    isIOS,
    isAndroid,
    isMobile,
    deviceType,
    deviceName,
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

  if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    throw new Error('Web Push on mobile requires an HTTPS connection (e.g. your live Vercel URL https://cashio-tracker.vercel.app). Mobile browsers reject push registrations over unencrypted HTTP.');
  }

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
      console.warn('[VAPID FETCH WARNING]: Failed to fetch VAPID public key', err.message);
    }
  }

  if (!vapidPublicKey) {
    throw new Error('Push notification server key is not available. Please try again later.');
  }

  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

  // 4. Clean up any existing stale push subscription to prevent key mismatch push service errors
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    try {
      await subscription.unsubscribe();
    } catch (unsubErr) {
      console.warn('[PUSH STALE UNSUB WARNING]:', unsubErr);
    }
    subscription = null;
  }

  // 5. Subscribe with PushManager
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
  } catch (subErr) {
    console.error('[PUSH SERVICE REGISTRATION ERROR]:', subErr);
    if (env.isBrave) {
      throw new Error('Brave blocked push services. Please open brave://settings/privacy, enable "Use Google services for push messaging", and relaunch Brave.');
    }
    if (subErr.name === 'AbortError' || subErr.message?.includes('push service error')) {
      throw new Error('Registration failed with Push Service Error. Please make sure: 1) You are on HTTPS (https://cashio-tracker.vercel.app), 2) Not in Incognito/Private mode, and 3) Google Play Services is active on your phone.');
    }
    throw subErr;
  }

  // 6. Send subscription keys to backend
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
