import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Read VAPID keys strictly from environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@cashio.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
    console.log('[WEB-PUSH] VAPID details initialized successfully');
  } catch (err) {
    console.error('[WEB-PUSH INIT ERROR]:', err.message);
  }
} else {
  console.warn('[WEB-PUSH WARNING] VAPID keys not configured in environment variables');
}

/**
 * In-memory cooldown tracker to avoid notification fatigue
 * Prevents automated notifications from firing too frequently (minimum 45-min gap between automated alerts)
 */
const userLastAutomatedPushMap = new Map();
const AUTOMATED_COOLDOWN_MS = 45 * 60 * 1000; // 45 minutes

/**
 * Returns the public VAPID key to the frontend
 */
export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}

/**
 * Parses user-agent to reliably identify device category, OS, and browser
 */
export function parseDeviceFromUserAgent(ua = '') {
  if (!ua || typeof ua !== 'string') {
    return {
      deviceType: 'desktop',
      deviceName: 'Desktop Browser',
      os: 'Unknown',
      browser: 'Browser',
      isMobile: false
    };
  }

  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && ua.includes('Touch'));
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (isIOS) os = 'iOS';
  else if (isAndroid) os = 'Android';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Chrome';
  else if (/Firefox\//i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

  const deviceType = isMobile ? 'mobile' : 'desktop';
  const deviceName = `${os} (${browser})`;

  return {
    deviceType,
    deviceName,
    os,
    browser,
    isMobile
  };
}

/**
 * Sends a web push notification to a single PushSubscription record
 */
export async function sendPushNotification({ subscription, title, body, icon = '/logo.png', badge = '/logo.png', tag, data = {}, actions = [] }) {
  if (!subscription || !subscription.endpoint || !subscription.p256dh || !subscription.auth) {
    return { success: false, error: 'Invalid subscription object' };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  };

  const payload = JSON.stringify({
    title: title || 'Cashio Finance',
    body: body || 'You have a new update from Cashio.',
    icon: icon || '/logo.png',
    badge: badge || '/logo.png',
    tag: tag || `cashio-${Date.now()}`,
    data: {
      url: data?.url || '/dashboard',
      type: data?.type || 'SYSTEM',
      timestamp: Date.now(),
      ...data
    },
    actions: actions.length > 0 ? actions : [
      { action: 'open', title: 'Open Cashio' }
    ]
  });

  try {
    const res = await webpush.sendNotification(pushSubscription, payload);
    return { success: true, statusCode: res.statusCode };
  } catch (err) {
    console.error(`[WEB-PUSH SEND ERROR for ${subscription.endpoint.substring(0, 30)}...]:`, err.statusCode || err.message);
    
    // HTTP 404 (Not Found) or 410 (Gone) indicates the subscription has expired or unsubscribed
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log(`[WEB-PUSH CLEANUP] Removing expired subscription endpoint: ${subscription.endpoint.substring(0, 40)}...`);
      try {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: subscription.endpoint }
        });
      } catch (cleanErr) {
        console.error('[WEB-PUSH CLEANUP ERROR]:', cleanErr.message);
      }
    }

    return { success: false, error: err.message, statusCode: err.statusCode };
  }
}

/**
 * Sends a push notification to active devices of a given user, respecting user preferences,
 * separate mobile/desktop channels, target device filtering, and smart throttling cooldowns.
 */
export async function sendPushToUser({
  userId,
  type = 'SYSTEM',
  title,
  body,
  icon = '/logo.png',
  badge = '/logo.png',
  tag,
  data = {},
  actions = [],
  targetEndpoint = null,
  targetDeviceType = null,
  isAutomated = false
}) {
  if (!userId) return { success: false, error: 'User ID is required' };

  try {
    // 1. Throttling Cooldown for automated notifications
    if (isAutomated) {
      const now = Date.now();
      const lastPush = userLastAutomatedPushMap.get(userId);
      if (lastPush && (now - lastPush < AUTOMATED_COOLDOWN_MS)) {
        const remainingMin = Math.ceil((AUTOMATED_COOLDOWN_MS - (now - lastPush)) / 60000);
        console.log(`[WEB-PUSH THROTTLED] Skipped automated push for user ${userId} to avoid notification fatigue (Cooldown: ${remainingMin}m remaining)`);
        return { success: true, skipped: true, reason: 'rate_limited_cooldown' };
      }
      userLastAutomatedPushMap.set(userId, now);
    }

    // 2. Check user notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (preferences) {
      if (type === 'BUDGET_ALERT' && preferences.budgetAlerts === false) {
        return { success: true, skipped: true, reason: 'preference_budgetAlerts_disabled' };
      }
      if (type === 'EXPENSE_REMINDER' && preferences.expenseReminders === false) {
        return { success: true, skipped: true, reason: 'preference_expenseReminders_disabled' };
      }
      if (type === 'WEEKLY_SUMMARY' && preferences.weeklySummary === false) {
        return { success: true, skipped: true, reason: 'preference_weeklySummary_disabled' };
      }
      if (type === 'SAVINGS_GOAL' && preferences.savingsGoalUpdates === false) {
        return { success: true, skipped: true, reason: 'preference_savingsGoalUpdates_disabled' };
      }
    }

    // 3. Fetch active push subscriptions for this user
    let subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, delivered: 0, message: 'No active push subscriptions found for user' };
    }

    // 4. Target endpoint filtering (e.g. testing from specific device)
    if (targetEndpoint) {
      const targetSub = subscriptions.find(s => s.endpoint === targetEndpoint);
      if (targetSub) {
        subscriptions = [targetSub];
      }
    }

    // 5. Separate device filtering (Mobile vs Desktop push channels)
    // Subscriptions are classified by User-Agent
    subscriptions = subscriptions.filter(sub => {
      const { deviceType } = parseDeviceFromUserAgent(sub.userAgent);

      // Target device filter if requested
      if (targetDeviceType && deviceType !== targetDeviceType) {
        return false;
      }

      return true;
    });

    if (subscriptions.length === 0) {
      return { success: true, delivered: 0, message: 'No matching device subscriptions found' };
    }

    // 6. Dispatch push to filtered endpoints
    const results = await Promise.allSettled(
      subscriptions.map(sub => {
        const { deviceType, deviceName } = parseDeviceFromUserAgent(sub.userAgent);
        return sendPushNotification({
          subscription: sub,
          title,
          body,
          icon,
          badge,
          tag: tag || `cashio-${type.toLowerCase()}-${Date.now()}`,
          data: {
            ...data,
            type,
            deviceType,
            deviceName
          },
          actions
        });
      })
    );

    const deliveredCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    return { success: true, delivered: deliveredCount, total: subscriptions.length };
  } catch (err) {
    console.error('[WEB-PUSH USER SEND ERROR]:', err);
    return { success: false, error: err.message };
  }
}
