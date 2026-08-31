import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

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
      whereClause.type = { in: ['EXPENSE_ALERT', 'SECURITY', 'SYSTEM'] };
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
