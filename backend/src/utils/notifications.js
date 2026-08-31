import { PrismaClient } from '@prisma/client';
import { sendPushToUser } from './webPush.js';

const prisma = new PrismaClient();

/**
 * Creates an in-app notification for a specified user and dispatches Web Push
 * @param {Object} params
 * @param {string} params.userId - Target user's ID
 * @param {string} params.type - Notification type ('SPLIT_CREATED', 'SPLIT_SETTLED', 'EXPENSE_ALERT', 'SECURITY', 'SYSTEM', 'BUDGET_ALERT', 'EXPENSE_REMINDER')
 * @param {string} params.title - Short header title
 * @param {string} params.message - Detailed notification description
 * @param {string} [params.link] - In-app navigation destination (e.g. '/splits', '/expenses')
 * @param {boolean} [params.sendPush] - Whether to dispatch web push notification (default: true)
 */
export async function createNotification({ userId, type, title, message, link = null, sendPush = true }) {
  try {
    if (!userId || !title || !message) {
      console.warn('[NOTIFICATIONS] Missing required fields for notification creation');
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type || 'SYSTEM',
        title,
        message,
        link,
        isRead: false
      }
    });

    // Asynchronously dispatch Web Push without blocking DB operation
    if (sendPush) {
      sendPushToUser({
        userId,
        type: type || 'SYSTEM',
        title,
        body: message,
        data: { url: link || '/dashboard', type }
      }).catch(err => {
        console.error('[NOTIFICATIONS PUSH DISPATCH ERROR]:', err.message);
      });
    }

    return notification;
  } catch (err) {
    console.error('[NOTIFICATIONS ERROR]: Failed to create notification:', err.message);
    return null;
  }
}
