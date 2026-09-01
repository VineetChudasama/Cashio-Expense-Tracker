import { PrismaClient } from '@prisma/client';
import { createNotification } from './notifications.js';

const prisma = new PrismaClient();

// Helper to get currency symbol
function getSymbol(currencyStr) {
  if (!currencyStr) return '$';
  if (currencyStr.includes('INR') || currencyStr.includes('₹')) return '₹';
  if (currencyStr.includes('EUR') || currencyStr.includes('€')) return '€';
  if (currencyStr.includes('GBP') || currencyStr.includes('£')) return '£';
  if (currencyStr.includes('JPY') || currencyStr.includes('¥')) return '¥';
  if (currencyStr.includes('CAD')) return 'CA$';
  if (currencyStr.includes('AUD')) return 'A$';
  if (currencyStr.includes('AED')) return 'AED ';
  if (currencyStr.includes('SGD')) return 'S$';
  return '$';
}

/**
 * Checks category spending limits when an expense is added or modified
 * and triggers High Spending Alerts at 50%, 80%, and 100%+ (exceeded) thresholds.
 * 
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.category
 * @param {number} params.newExpenseAmount
 * @param {Date|string} params.expenseDate
 */
export async function checkAndTriggerSpendingAlerts({ userId, category, newExpenseAmount, expenseDate = new Date() }) {
  try {
    if (!userId || !category || !newExpenseAmount || newExpenseAmount <= 0) {
      return null;
    }

    // 1. Fetch user's category limit
    const categoryLimit = await prisma.categoryLimit.findUnique({
      where: {
        userId_category: {
          userId,
          category
        }
      }
    });

    if (!categoryLimit || categoryLimit.limit <= 0) {
      return null;
    }

    const limit = categoryLimit.limit;
    const dateObj = new Date(expenseDate);
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();

    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // 2. Aggregate all expenses in this category for the current month
    const aggregate = await prisma.expense.aggregate({
      where: {
        userId,
        category,
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    const currentTotal = aggregate._sum.amount || 0;
    const prevTotal = Math.max(0, currentTotal - parseFloat(newExpenseAmount));

    const prevPercent = (prevTotal / limit) * 100;
    const newPercent = (currentTotal / limit) * 100;

    // 3. Fetch user details for currency symbol
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true, name: true }
    });

    const symbol = getSymbol(user?.currency);
    const formattedLimit = `${symbol}${limit.toLocaleString()}`;
    const formattedSpent = `${symbol}${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

    let alertTitle = '';
    let alertMessage = '';

    // Threshold Check: Exceeded (100%+)
    if (prevPercent < 100 && newPercent >= 100) {
      const overage = currentTotal - limit;
      const formattedOverage = `${symbol}${overage.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      
      alertTitle = `🚨 Budget Exceeded: ${category}`;
      alertMessage = `High spending alert! You have exceeded your monthly ${category} limit of ${formattedLimit} by ${formattedOverage} (Total spent: ${formattedSpent}).`;
    }
    // Threshold Check: 80% Used
    else if (prevPercent < 80 && newPercent >= 80 && newPercent < 100) {
      alertTitle = `⚠️ 80% High Spending Alert: ${category}`;
      alertMessage = `Warning: You have reached ${newPercent.toFixed(0)}% of your monthly ${category} budget (${formattedSpent} of ${formattedLimit}).`;
    }
    // Threshold Check: 50% Used
    else if (prevPercent < 50 && newPercent >= 50 && newPercent < 80) {
      alertTitle = `⚡ 50% Category Budget Used: ${category}`;
      alertMessage = `You have used ${newPercent.toFixed(0)}% of your monthly ${category} budget (${formattedSpent} of ${formattedLimit}).`;
    }

    if (alertTitle && alertMessage) {
      const notification = await createNotification({
        userId,
        type: 'EXPENSE_ALERT',
        title: alertTitle,
        message: alertMessage,
        link: '/expenses',
        sendPush: true
      });

      console.log(`[SPENDING ALERT] Triggered for user ${userId} on ${category}: ${alertTitle}`);
      return notification;
    }

    return null;
  } catch (err) {
    console.error('[SPENDING ALERT ERROR]:', err);
    return null;
  }
}
