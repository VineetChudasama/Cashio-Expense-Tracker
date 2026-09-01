import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.js';

const prisma = new PrismaClient();

// In-memory cache to prevent duplicate alerts within same cycle
const sentEventCache = new Set();

/**
 * Runs automated background checks for:
 * 1. Evening expense reminders (strictly 8:00 PM - 10:00 PM)
 * 2. 1-day advance recurring expense alerts (with amount and description/reason)
 * 3. Budget thresholds (80% and 100%)
 * 4. Weekly spending digests on Sunday
 */
export async function runScheduledNotificationChecks() {
  try {
    const today = new Date();
    const currentHour = today.getHours(); // 0 - 23
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

      const userCurrency = user.currency?.split(' ')[0] || '$';

      // =========================================================================
      // 1. DAILY EXPENSE REMINDER (STRICTLY EVENING: 8:00 PM - 10:00 PM)
      // =========================================================================
      if (prefs.expenseReminders && currentHour >= 20 && currentHour <= 22) {
        const reminderTag = `reminder-${user.id}-${todayStr}`;
        if (!sentEventCache.has(reminderTag)) {
          const startOfToday = new Date(currentYear, currentMonth, today.getDate());
          const expenseToday = await prisma.expense.findFirst({
            where: {
              userId: user.id,
              date: { gte: startOfToday }
            }
          });

          // Only alert if user has not yet recorded any expense today
          if (!expenseToday) {
            sentEventCache.add(reminderTag);
            await createNotification({
              userId: user.id,
              type: 'EXPENSE_REMINDER',
              title: '🧾 Cashio Evening Reminder',
              message: "Don't forget to record today's expenses and keep your cash flow up to date.",
              link: '/expenses'
            });
          }
        }
      }

      // =========================================================================
      // 2. RECURRING EXPENSE NOTIFICATION (1 DAY IN ADVANCE)
      // =========================================================================
      try {
        // A. Explicit Recurring Expenses
        const explicitRecurringExpenses = await prisma.expense.findMany({
          where: {
            userId: user.id,
            isRecurring: true
          }
        });

        const oneDayMs = 24 * 60 * 60 * 1000;
        const tomorrowDate = new Date(today.getTime() + oneDayMs);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

        for (const exp of explicitRecurringExpenses) {
          const nextDueDate = calculateNextRecurringDueDate(exp.date, exp.recurringInterval || 'monthly');
          if (nextDueDate) {
            const nextDueStr = nextDueDate.toISOString().split('T')[0];

            // If due date is tomorrow
            if (nextDueStr === tomorrowStr) {
              const recurringTag = `recurring-exp-${user.id}-${exp.id}-${nextDueStr}`;
              if (!sentEventCache.has(recurringTag)) {
                sentEventCache.add(recurringTag);
                const reason = exp.description?.trim() || exp.category || 'Recurring bill';
                await createNotification({
                  userId: user.id,
                  type: 'RECURRING_EXPENSE',
                  title: '🗓️ Upcoming Payment Tomorrow',
                  message: `Reminder: Your recurring payment of ${userCurrency}${exp.amount.toFixed(2)} for "${reason}" is due tomorrow.`,
                  link: '/expenses'
                });
              }
            }
          }
        }

        // B. Detected Recurring Patterns (AI Projections)
        const detectedPatterns = await prisma.recurringPattern.findMany({
          where: {
            userId: user.id,
            confidence: { gte: 0.6 }
          }
        });

        for (const pattern of detectedPatterns) {
          const lastDate = new Date(pattern.lastOccurrence);
          const nextProjectedDate = new Date(lastDate.getTime() + pattern.avgIntervalDays * oneDayMs);
          const nextProjectedStr = nextProjectedDate.toISOString().split('T')[0];

          if (nextProjectedStr === tomorrowStr) {
            const patternTag = `recurring-pat-${user.id}-${pattern.id}-${nextProjectedStr}`;
            if (!sentEventCache.has(patternTag)) {
              sentEventCache.add(patternTag);
              await createNotification({
                userId: user.id,
                type: 'RECURRING_EXPENSE',
                title: '🗓️ Expected Recurring Payment Tomorrow',
                message: `Reminder: Your projected payment of ${userCurrency}${pattern.avgAmount.toFixed(2)} for "${pattern.category}" is due tomorrow.`,
                link: '/forecast'
              });
            }
          }
        }
      } catch (recErr) {
        console.error(`[PUSH SCHEDULER RECURRING CHECK ERROR for ${user.id}]:`, recErr.message);
      }

      // =========================================================================
      // 3. BUDGET THRESHOLD ALERTS (80% & 100%)
      // =========================================================================
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

          // Estimate monthly baseline from previous 3 months
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
                message: `You've exceeded your monthly baseline budget (${userCurrency}${currentSpent.toFixed(2)} spent).`,
                link: '/dashboard'
              });
            } else if (usageRatio >= 0.8 && !sentEventCache.has(budget80Tag)) {
              sentEventCache.add(budget80Tag);
              await createNotification({
                userId: user.id,
                type: 'BUDGET_ALERT',
                title: '💰 Cashio Budget Alert',
                message: `You've reached 80% of your estimated monthly spending budget (${userCurrency}${currentSpent.toFixed(2)}).`,
                link: '/dashboard'
              });
            }
          }
        }
      }

      // =========================================================================
      // 4. WEEKLY SPENDING SUMMARY (SUNDAY DIGEST)
      // =========================================================================
      if (prefs.weeklySummary && dayOfWeek === 0 && currentHour >= 18 && currentHour <= 21) {
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
            message: `You spent ${userCurrency}${spent.toFixed(2)} across the past 7 days.`,
            link: '/insights'
          });
        }
      }
    }
  } catch (err) {
    console.error('[PUSH SCHEDULER ERROR]:', err);
  }
}

/**
 * Calculates next recurring due date given the original date and interval
 */
function calculateNextRecurringDueDate(originalDate, interval = 'monthly') {
  const base = new Date(originalDate);
  const now = new Date();
  let next = new Date(base);

  const normalized = (interval || '').toLowerCase();

  // Advance next date until it is in the future
  while (next <= now) {
    if (normalized === 'weekly') {
      next = new Date(next.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (normalized === 'yearly' || normalized === 'annual') {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      // Default monthly
      next.setMonth(next.getMonth() + 1);
    }
  }

  return next;
}

/**
 * Initializes recurring background scheduler interval (checks every 30 minutes)
 */
export function startNotificationScheduler() {
  console.log('[PUSH SCHEDULER] Background push notification scheduler started');
  
  // Initial check on startup
  setTimeout(() => {
    runScheduledNotificationChecks();
  }, 20000);

  // Periodic check every 30 minutes
  setInterval(() => {
    runScheduledNotificationChecks();
  }, 30 * 60 * 1000);
}
