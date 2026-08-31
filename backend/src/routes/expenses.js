import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

import { createNotification } from '../utils/notifications.js';

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
  body('amount').isFloat({ gt: 0 }),
  body('category').notEmpty(),
  body('date').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { amount, category, description, date, isRecurring, recurringInterval } = req.body;
    if (isRecurring && !recurringInterval) {
      return res.status(400).json({ success: false, error: 'recurringInterval required when isRecurring is true' });
    }
    
    const expense = await prisma.expense.create({
      data: {
        userId: req.user.id,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date: new Date(date),
        isRecurring: isRecurring || false,
        recurringInterval: recurringInterval || null
      }
    });

    // Trigger high spending alert if expense is substantial (>= $500)
    if (parseFloat(amount) >= 500) {
      createNotification({
        userId: req.user.id,
        type: 'EXPENSE_ALERT',
        title: 'High Spending Alert',
        message: `You recorded a major expense of $${parseFloat(amount).toFixed(2)} in ${category}${description ? ` ("${description}")` : ''}.`,
        link: '/expenses'
      });
    }

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
