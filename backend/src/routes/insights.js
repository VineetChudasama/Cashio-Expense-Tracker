import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { generateInsights } from '../utils/insights.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' }
    });
    
    const insights = generateInsights(expenses);
    
    res.json({ success: true, data: { insights } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
