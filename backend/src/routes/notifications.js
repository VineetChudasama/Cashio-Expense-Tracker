import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { getVapidPublicKey, sendPushToUser } from '../utils/webPush.js';

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
 * Returns the user's notification preferences (creates defaults if none exist)
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

    const subscriptionsCount = await prisma.pushSubscription.count({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: {
        preferences,
        isSubscribed: subscriptionsCount > 0,
        subscriptionsCount
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
    const { budgetAlerts, expenseReminders, weeklySummary, savingsGoalUpdates } = req.body;

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

    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers['user-agent'] || null
      },
      create: {
        userId: req.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers['user-agent'] || null
      }
    });

    res.json({
      success: true,
      message: 'Push notification subscription registered successfully',
      data: { id: subscription.id }
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
 * Sends a test Web Push notification to the authenticated user's registered devices
 */
router.post('/test', async (req, res) => {
  try {
    const result = await sendPushToUser({
      userId: req.user.id,
      type: 'SYSTEM',
      title: '💚 Cashio Notifications',
      body: 'Notifications are working correctly!',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: `cashio-test-${Date.now()}`,
      data: {
        url: '/dashboard',
        type: 'TEST'
      }
    });

    if (result.delivered === 0 && result.total === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active push subscriptions found on this account. Please enable notifications in your browser first.'
      });
    }

    res.json({
      success: true,
      message: 'Test notification dispatched successfully!',
      data: result
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
      whereClause.type = { in: ['EXPENSE_ALERT', 'SECURITY', 'SYSTEM', 'BUDGET_ALERT', 'EXPENSE_REMINDER', 'WEEKLY_SUMMARY', 'SAVINGS_GOAL'] };
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

export default router;

