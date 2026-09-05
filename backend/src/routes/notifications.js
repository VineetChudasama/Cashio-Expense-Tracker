import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { getVapidPublicKey, sendPushToUser, parseDeviceFromUserAgent } from '../utils/webPush.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/notifications/vapid-public-key
 * Returns the VAPID Public Key required for client PushManager subscription
 */
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.json({
      success: true,
      data: { publicKey }
    });
  } catch (err) {
    console.error('[VAPID PUBLIC KEY ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.use(authMiddleware);

/**
 * GET /api/notifications/preferences
 * Returns the user's notification preferences and active registered devices
 */
router.get('/preferences', async (req, res) => {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: req.user.id }
    });

    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: req.user.id,
          budgetAlerts: true,
          expenseReminders: true,
          weeklySummary: true,
          savingsGoalUpdates: false
        }
      });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    // Classify user's registered devices and deduplicate by deviceName
    const seenDevices = new Set();
    const uniqueDevices = [];
    for (const sub of subscriptions) {
      const parsed = parseDeviceFromUserAgent(sub.userAgent);
      if (!seenDevices.has(parsed.deviceName)) {
        seenDevices.add(parsed.deviceName);
        uniqueDevices.push({
          id: sub.id,
          endpoint: sub.endpoint,
          deviceType: parsed.deviceType,
          deviceName: parsed.deviceName,
          os: parsed.os,
          browser: parsed.browser,
          createdAt: sub.createdAt
        });
      }
    }

    res.json({
      success: true,
      data: {
        preferences,
        isSubscribed: uniqueDevices.length > 0,
        subscriptionsCount: uniqueDevices.length,
        devices: uniqueDevices
      }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS PREFERENCES GET ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/notifications/preferences
 * Updates the user's notification category preferences
 */
router.put('/preferences', async (req, res) => {
  try {
    const {
      budgetAlerts,
      expenseReminders,
      weeklySummary,
      savingsGoalUpdates
    } = req.body;

    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: req.user.id },
      update: {
        budgetAlerts: typeof budgetAlerts === 'boolean' ? budgetAlerts : undefined,
        expenseReminders: typeof expenseReminders === 'boolean' ? expenseReminders : undefined,
        weeklySummary: typeof weeklySummary === 'boolean' ? weeklySummary : undefined,
        savingsGoalUpdates: typeof savingsGoalUpdates === 'boolean' ? savingsGoalUpdates : undefined
      },
      create: {
        userId: req.user.id,
        budgetAlerts: typeof budgetAlerts === 'boolean' ? budgetAlerts : true,
        expenseReminders: typeof expenseReminders === 'boolean' ? expenseReminders : true,
        weeklySummary: typeof weeklySummary === 'boolean' ? weeklySummary : true,
        savingsGoalUpdates: typeof savingsGoalUpdates === 'boolean' ? savingsGoalUpdates : false
      }
    });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: { preferences }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS PREFERENCES UPDATE ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/notifications/subscribe
 * Registers or updates a client PushSubscription endpoint
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({
        success: false,
        error: 'Invalid push subscription payload. Required: endpoint, keys.p256dh, keys.auth'
      });
    }

    const effectiveUserAgent = userAgent || req.headers['user-agent'] || null;

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: effectiveUserAgent
      },
      create: {
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: effectiveUserAgent
      }
    });

    const parsedDevice = parseDeviceFromUserAgent(effectiveUserAgent);

    // Prune older stale subscriptions for this device name to prevent duplicates
    try {
      const existingForDevice = await prisma.pushSubscription.findMany({
        where: {
          userId: req.user.id,
          endpoint: { not: endpoint }
        }
      });
      for (const oldSub of existingForDevice) {
        const oldParsed = parseDeviceFromUserAgent(oldSub.userAgent);
        if (oldParsed.deviceName === parsedDevice.deviceName) {
          await prisma.pushSubscription.delete({ where: { id: oldSub.id } });
        }
      }
    } catch (cleanupErr) {
      console.warn('[PUSH SUBSCRIPTION CLEANUP NOTICE]:', cleanupErr.message);
    }

    res.json({
      success: true,
      message: `Push notification subscription registered successfully for ${parsedDevice.deviceName}`,
      data: {
        id: subscription.id,
        deviceType: parsedDevice.deviceType,
        deviceName: parsedDevice.deviceName
      }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS SUBSCRIBE ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/notifications/unsubscribe
 * Removes push subscription(s) for the user
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: req.user.id,
          endpoint
        }
      });
    } else {
      await prisma.pushSubscription.deleteMany({
        where: { userId: req.user.id }
      });
    }

    res.json({
      success: true,
      message: 'Push notification subscription removed'
    });
  } catch (err) {
    console.error('[NOTIFICATIONS UNSUBSCRIBE ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/notifications/test
 * Detects whether user is currently on mobile or laptop browser and sends targeted test notification
 */
router.post('/test', async (req, res) => {
  try {
    const clientUa = req.body?.userAgent || req.headers['user-agent'] || '';
    const clientEndpoint = req.body?.endpoint || null;
    const clientDeviceType = req.body?.deviceType || null;

    const { deviceType, deviceName } = parseDeviceFromUserAgent(clientUa);
    const effectiveDeviceType = clientDeviceType || deviceType;
    const isMobile = effectiveDeviceType === 'mobile';

    const title = isMobile ? '📱 Cashio Mobile Notification' : '💻 Cashio Desktop Notification';
    const body = `Notifications are verified and working on your ${isMobile ? 'phone' : 'computer'} (${deviceName})!`;

    // 1. Create in-app notification record so it is always visible in the notification bell
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'SYSTEM',
        title,
        message: body,
        link: '/profile',
        isRead: false
      }
    });

    // 2. Dispatch Web Push notification to device(s)
    const result = await sendPushToUser({
      userId: req.user.id,
      type: 'SYSTEM',
      title,
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `cashio-test-${Date.now()}`,
      targetEndpoint: clientEndpoint,
      data: {
        url: '/profile',
        type: 'TEST',
        deviceType: effectiveDeviceType,
        deviceName
      }
    });

    if (result.delivered === 0 && result.total === 0) {
      return res.status(400).json({
        success: false,
        error: `No active push subscription found for this ${effectiveDeviceType === 'mobile' ? 'mobile device' : 'desktop browser'}. Please enable notifications first.`
      });
    }

    res.json({
      success: true,
      message: `Test notification sent to your ${effectiveDeviceType === 'mobile' ? 'mobile phone' : 'computer'} (${deviceName})!`,
      data: {
        ...result,
        deviceType: effectiveDeviceType,
        deviceName
      }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS TEST ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/notifications
 * Retrieves all notifications for the authenticated user along with total unread count
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const filter = req.query.filter; // 'all', 'unread', 'splits', 'alerts'

    const whereClause = { userId: req.user.id };

    if (filter === 'unread') {
      whereClause.isRead = false;
    } else if (filter === 'splits') {
      whereClause.type = { in: ['SPLIT_CREATED', 'SPLIT_SETTLED'] };
    } else if (filter === 'alerts') {
      whereClause.type = {
        in: [
          'EXPENSE_ALERT',
          'SECURITY',
          'SYSTEM',
          'BUDGET_ALERT',
          'EXPENSE_REMINDER',
          'WEEKLY_SUMMARY',
          'SAVINGS_GOAL',
          'RECURRING_EXPENSE'
        ]
      };
    }

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false }
      }),
      prisma.notification.count({
        where: { userId: req.user.id }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total
      }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS GET ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a specific notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      success: true,
      data: {
        notification: updated,
        unreadCount
      }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS READ ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications for the user as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: { unreadCount: 0 }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS READ ALL ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/notifications/clear-all
 * Clears all notifications for the authenticated user
 */
router.delete('/clear-all', async (req, res) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
      data: { unreadCount: 0 }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS CLEAR ALL ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/notifications/:id
 * Deletes a single notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });

    res.json({
      success: true,
      message: 'Notification deleted',
      data: { unreadCount }
    });
  } catch (err) {
    console.error('[NOTIFICATIONS DELETE ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
