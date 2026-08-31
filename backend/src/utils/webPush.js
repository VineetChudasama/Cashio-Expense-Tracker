import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fallback VAPID keys for immediate local development if not in env
const DEFAULT_VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKU_2thwlK44Rovjnm2PrMU30q14G1vm11VV7JPEiVOhfHNnyFSaxIlrZ3zfY9VZKhj_6Ump_5REfOvyVdodeQo';
const DEFAULT_VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'RJ0YHWonnJVlGnQYhilyjWwBROWv4T07iAS77L6AEgs';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@cashio.app';

try {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    DEFAULT_VAPID_PUBLIC_KEY,
    DEFAULT_VAPID_PRIVATE_KEY
  );
  console.log('[WEB-PUSH] VAPID details initialized successfully');
} catch (err) {
  console.error('[WEB-PUSH INIT ERROR]:', err.message);
}

/**
 * Returns the public VAPID key to the frontend
 */
export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
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
 * Sends a push notification to all active devices of a given user, respecting user preferences
 */
export async function sendPushToUser({ userId, type = 'SYSTEM', title, body, icon = '/logo.png', badge = '/logo.png', tag, data = {}, actions = [] }) {
  if (!userId) return { success: false, error: 'User ID is required' };

  try {
    // 1. Check user notification preferences
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (preferences) {
      if (type === 'BUDGET_ALERT' && !preferences.budgetAlerts) {
        console.log(`[WEB-PUSH] Skipped BUDGET_ALERT for user ${userId} per preferences`);
        return { success: true, skipped: true, reason: 'preference_disabled' };
      }
      if (type === 'EXPENSE_REMINDER' && !preferences.expenseReminders) {
        console.log(`[WEB-PUSH] Skipped EXPENSE_REMINDER for user ${userId} per preferences`);
        return { success: true, skipped: true, reason: 'preference_disabled' };
      }
      if (type === 'WEEKLY_SUMMARY' && !preferences.weeklySummary) {
        console.log(`[WEB-PUSH] Skipped WEEKLY_SUMMARY for user ${userId} per preferences`);
        return { success: true, skipped: true, reason: 'preference_disabled' };
      }
      if (type === 'SAVINGS_GOAL' && !preferences.savingsGoalUpdates) {
        console.log(`[WEB-PUSH] Skipped SAVINGS_GOAL for user ${userId} per preferences`);
        return { success: true, skipped: true, reason: 'preference_disabled' };
      }
    }

    // 2. Fetch active push subscriptions for this user
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, delivered: 0, message: 'No active push subscriptions found for user' };
    }

    // 3. Dispatch push to all active endpoints
    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushNotification({
        subscription: sub,
        title,
        body,
        icon,
        badge,
        tag: tag || `cashio-${type.toLowerCase()}-${Date.now()}`,
        data: {
          ...data,
          type
        },
        actions
      }))
    );

    const deliveredCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    return { success: true, delivered: deliveredCount, total: subscriptions.length };
  } catch (err) {
    console.error('[WEB-PUSH USER SEND ERROR]:', err);
    return { success: false, error: err.message };
  }
}
