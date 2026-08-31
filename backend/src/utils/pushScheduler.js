import { PrismaClient } from '@prisma/client';
import { sendPushToUser } from './webPush.js';
import { createNotification } from './notifications.js';

const prisma = new PrismaClient();

// Cache to prevent duplicate scheduled checks in memory during same cycle
const sentEventCache = new Set();

/**
 * Runs automated background checks for budget alerts, expense reminders, and weekly summaries.
 */
export async function runScheduledNotificationChecks() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const dayOfWeek = today.getDay(); // 0 is Sunday

    // Fetch all users who have active subscriptions and preferences
    const usersWithSubscriptions = await prisma.user.findMany({
      where: {
        pushSubscriptions: {
          some: {}
        }
      },
      include: {
        notificationPreference: true,
        pushSubscriptions: true
      }
    });

    for (const user of usersWithSubscriptions) {
      const prefs = user.notificationPreference || {
        budgetAlerts: true,
        expenseReminders: true,
        weeklySummary: true,
        savingsGoalUpdates: false
      };

      // --- 1. DAILY EXPENSE REMINDER ---
      if (prefs.expenseReminders) {
        const reminderTag = `reminder-${user.id}-${todayStr}`;
        if (!sentEventCache.has(reminderTag)) {
          // Check if user has logged any expense today
          const startOfToday = new Date(todayYear(), today.getMonth(), today.getDate());
          const expenseToday = await prisma.expense.findFirst({
            where: {
              userId: user.id,
              date: { gte: startOfToday }
            }
          });

          // If no expenses added today and it's evening (or test time)
          if (!expenseToday) {
            sentEventCache.add(reminderTag);
            await createNotification({
              userId: user.id,
              type: 'EXPENSE_REMINDER',
              title: '🧾 Cashio Reminder',
              message: "Don't forget to add today's expenses and keep your flow accurate.",
              link: '/expenses'
            });
          }
        }
      }

      // --- 2. BUDGET ALERTS ---
      if (prefs.budgetAlerts) {
        const budget80Tag = `budget-80-${user.id}-${currentYear}-${currentMonth}`;
        const budget100Tag = `budget-100-${user.id}-${currentYear}-${currentMonth}`;

        if (!sentEventCache.has(budget80Tag) || !sentEventCache.has(budget100Tag)) {
          const startOfMonth = new Date(currentYear, currentMonth, 1);
          
          const currentMonthExpenses = await prisma.expense.aggregate({
            where: {
              userId: user.id,
              date: { gte: startOfMonth }
            },
            _sum: { amount: true }
          });

          const currentSpent = currentMonthExpenses._sum.amount || 0;

          // Estimate monthly baseline from previous months
          const threeMonthsAgo = new Date(currentYear, currentMonth - 3, 1);
          const pastExpenses = await prisma.expense.aggregate({
            where: {
              userId: user.id,
              date: { gte: threeMonthsAgo, lt: startOfMonth }
            },
            _sum: { amount: true }
          });

          const monthlyBaseline = (pastExpenses._sum.amount || 0) / 3 || 1000;

          if (monthlyBaseline > 0) {
            const usageRatio = currentSpent / monthlyBaseline;

            if (usageRatio >= 1.0 && !sentEventCache.has(budget100Tag)) {
              sentEventCache.add(budget100Tag);
              await createNotification({
                userId: user.id,
                type: 'BUDGET_ALERT',
                title: '⚠️ Budget Exceeded',
                message: "You've exceeded your projected monthly spending budget.",
                link: '/dashboard'
              });
            } else if (usageRatio >= 0.8 && !sentEventCache.has(budget80Tag)) {
              sentEventCache.add(budget80Tag);
              await createNotification({
                userId: user.id,
                type: 'BUDGET_ALERT',
                title: '💰 Cashio Budget Alert',
                message: "You've reached 80% of your projected monthly spending budget.",
                link: '/dashboard'
              });
            }
          }
        }
      }

      // --- 3. WEEKLY SPENDING SUMMARY (Runs on Sundays) ---
      if (prefs.weeklySummary && dayOfWeek === 0) {
        const weeklyTag = `weekly-${user.id}-${todayStr}`;
        if (!sentEventCache.has(weeklyTag)) {
          const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          const weeklySum = await prisma.expense.aggregate({
            where: {
              userId: user.id,
              date: { gte: sevenDaysAgo }
            },
            _sum: { amount: true }
          });

          const spent = weeklySum._sum.amount || 0;
          sentEventCache.add(weeklyTag);
          await createNotification({
            userId: user.id,
            type: 'WEEKLY_SUMMARY',
            title: '📊 Your Weekly Spending',
            message: `You spent ${user.currency?.split(' ')[0] || '$'}${spent.toFixed(2)} across the past 7 days.`,
            link: '/insights'
          });
        }
      }
    }
  } catch (err) {
    console.error('[PUSH SCHEDULER ERROR]:', err);
  }
}

function todayYear() {
  return new Date().getFullYear();
}

/**
 * Initializes recurring background scheduler interval (checks every hour)
 */
export function startNotificationScheduler() {
  console.log('[PUSH SCHEDULER] Background push notification scheduler started');
  
  // Run once on startup after 30 seconds
  setTimeout(() => {
    runScheduledNotificationChecks();
  }, 30000);

  // Then check every hour
  setInterval(() => {
    runScheduledNotificationChecks();
  }, 60 * 60 * 1000);
}
