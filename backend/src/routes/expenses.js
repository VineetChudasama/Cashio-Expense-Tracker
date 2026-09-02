import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

import { createNotification } from '../utils/notifications.js';
import { checkAndTriggerSpendingAlerts } from '../utils/spendingAlerts.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/categories/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { userId: req.user.id };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const summary = await prisma.expense.groupBy({
      by: ['category'],
      where,
      _sum: { amount: true },
      _count: { _all: true }
    });
    
    const formattedSummary = summary.map(item => ({
      category: item.category,
      total: item._sum.amount,
      count: item._count._all
    }));
    
    res.json({ success: true, data: formattedSummary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, category, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = { userId: req.user.id };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: { sharedExpense: { select: { id: true } } }
      }),
      prisma.expense.count({ where })
    ]);
    
    res.json({
      success: true,
      data: { expenses, total, page: parseInt(page), totalPages: Math.ceil(total / take) }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const expense = await prisma.expense.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', [
  body('amount').isFloat({ gt: 0, lte: 100000 }).withMessage('Expense amount must be greater than 0 and cannot exceed 100,000'),
  body('category').notEmpty().withMessage('Category is required'),
  body('date').isISO8601().withMessage('Valid date is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { amount, category, description, date, isRecurring, recurringInterval } = req.body;
    const parsedAmount = parseFloat(amount);
    if (parsedAmount > 100000) {
      return res.status(400).json({ success: false, error: 'Maximum limit of 100,000 exceeded per expense created' });
    }
    if (isRecurring && !recurringInterval) {
      return res.status(400).json({ success: false, error: 'recurringInterval required when isRecurring is true' });
    }
    
    const expense = await prisma.expense.create({
      data: {
        userId: req.user.id,
        amount: parsedAmount,
        category,
        description: description || '',
        date: new Date(date),
        isRecurring: isRecurring || false,
        recurringInterval: recurringInterval || null
      }
    });

    // Trigger High Spending Alerts based on configured Category Limits (50%, 80%, 100%+ exceeded)
    checkAndTriggerSpendingAlerts({
      userId: req.user.id,
      category,
      newExpenseAmount: parsedAmount,
      expenseDate: date
    }).catch(err => console.error('[EXPENSE SPENDING ALERT ERROR]:', err));

    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Expense not found' });
    
    const { amount, category, description, date, isRecurring, recurringInterval } = req.body;
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
        return res.status(400).json({ success: false, error: 'Expense amount must be greater than 0 and cannot exceed 100,000' });
      }
    }
    
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: {
        amount: amount ? parseFloat(amount) : undefined,
        category,
        description,
        date: date ? new Date(date) : undefined,
        isRecurring,
        recurringInterval
      }
    });

    // Check spending alerts after update
    checkAndTriggerSpendingAlerts({
      userId: req.user.id,
      category: expense.category,
      newExpenseAmount: expense.amount,
      expenseDate: expense.date
    }).catch(err => console.error('[EXPENSE UPDATE ALERT ERROR]:', err));

    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await prisma.expense.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Expense not found' });
    
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
