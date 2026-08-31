import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates an in-app notification for a specified user
 * @param {Object} params
 * @param {string} params.userId - Target user's ID
 * @param {string} params.type - Notification type ('SPLIT_CREATED', 'SPLIT_SETTLED', 'EXPENSE_ALERT', 'SECURITY', 'SYSTEM')
 * @param {string} params.title - Short header title
 * @param {string} params.message - Detailed notification description
 * @param {string} [params.link] - In-app navigation destination (e.g. '/splits', '/expenses')
 */
export async function createNotification({ userId, type, title, message, link = null }) {
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

    return notification;
  } catch (err) {
    console.error('[NOTIFICATIONS ERROR]: Failed to create notification:', err.message);
    return null;
  }
}
