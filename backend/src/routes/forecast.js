import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { detectRecurringPatterns, generateProjections } from '../utils/recurring.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    let patterns = await prisma.recurringPattern.findMany({ where: { userId: req.user.id } });
    
    if (patterns.length === 0) {
      const allExpenses = await prisma.expense.findMany({
        where: { userId: req.user.id }
      });
      const detected = detectRecurringPatterns(allExpenses);
      
      for (const p of detected) {
        await prisma.recurringPattern.upsert({
          where: { userId_category: { userId: req.user.id, category: p.category } },
          update: {
            avgAmount: p.avgAmount,
            avgIntervalDays: p.avgIntervalDays,
            lastOccurrence: p.lastOccurrence,
            dataPoints: p.dataPoints,
            confidence: p.confidence
          },
          create: {
            userId: req.user.id,
            ...p
          }
        });
      }
      patterns = await prisma.recurringPattern.findMany({ where: { userId: req.user.id } });
    }

    const projections = generateProjections(patterns, days);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const actualExpenses = await prisma.expense.findMany({
      where: { userId: req.user.id, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' }
    });

    res.json({ success: true, data: { patterns, projections, actualExpenses } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/detect', async (req, res) => {
  try {
    const allExpenses = await prisma.expense.findMany({
      where: { userId: req.user.id }
    });
    
    const detected = detectRecurringPatterns(allExpenses);
    
    for (const p of detected) {
      await prisma.recurringPattern.upsert({
        where: { userId_category: { userId: req.user.id, category: p.category } },
        update: {
          avgAmount: p.avgAmount,
          avgIntervalDays: p.avgIntervalDays,
          lastOccurrence: p.lastOccurrence,
          dataPoints: p.dataPoints,
          confidence: p.confidence
        },
        create: {
          userId: req.user.id,
          ...p
        }
      });
    }
    
    const updatedPatterns = await prisma.recurringPattern.findMany({ where: { userId: req.user.id } });
    res.json({ success: true, data: updatedPatterns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
