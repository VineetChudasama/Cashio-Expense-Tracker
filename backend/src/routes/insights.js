import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { generateInsights } from '../utils/insights.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const [user, expenses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { currency: true }
      }),
      prisma.expense.findMany({
        where: { userId: req.user.id },
        orderBy: { date: 'desc' }
      })
    ]);

    const currencySymbol = user?.currency?.split(' ')[0] || '$';
    const insights = generateInsights(expenses, currencySymbol);
    
    res.json({ success: true, data: { insights } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
