import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { simplifyDebts } from '../utils/debtSimplify.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.post('/', [
  body('expenseId').notEmpty(),
  body('participants').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { expenseId, participants } = req.body;
    
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, userId: req.user.id }
    });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found or unauthorized' });

    const sharedExpense = await prisma.sharedExpense.create({
      data: {
        expenseId,
        createdByUserId: req.user.id,
        participants: {
          create: participants.map(p => ({
            userId: p.userId,
            amountOwed: parseFloat(p.amountOwed),
            settled: false
          }))
        }
      },
      include: { participants: true }
    });
    
    res.json({ success: true, data: sharedExpense });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const sharedExpenses = await prisma.sharedExpense.findMany({
      where: {
        OR: [
          { createdByUserId: req.user.id },
          { participants: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        expense: true,
        createdBy: { select: { id: true, name: true, email: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { expense: { date: 'desc' } }
    });
    res.json({ success: true, data: sharedExpenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/balances', async (req, res) => {
  try {
    const sharedExpenses = await prisma.sharedExpense.findMany({
      where: {
        OR: [
          { createdByUserId: req.user.id },
          { participants: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    const balances = new Map();

    for (const se of sharedExpenses) {
      const isCreator = se.createdByUserId === req.user.id;
      
      for (const p of se.participants) {
        if (p.settled) continue;
        
        if (isCreator && p.userId !== req.user.id) {
          // They owe me
          const current = balances.get(p.userId) || { id: p.userId, name: p.user.name, email: p.user.email, amount: 0 };
          current.amount += p.amountOwed;
          balances.set(p.userId, current);
        } else if (!isCreator && p.userId === req.user.id) {
          // I owe them (creator)
          const current = balances.get(se.createdByUserId) || { id: se.createdBy.id, name: se.createdBy.name, email: se.createdBy.email, amount: 0 };
          current.amount -= p.amountOwed;
          balances.set(se.createdByUserId, current);
        }
      }
    }

    res.json({ success: true, data: { balances: Array.from(balances.values()) } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/settle', async (req, res) => {
  try {
    const sharedExpenses = await prisma.sharedExpense.findMany({
      where: {
        OR: [
          { createdByUserId: req.user.id },
          { participants: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true } } } },
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    const balancesMap = new Map();
    const userLookup = new Map();
    userLookup.set(req.user.id, { id: req.user.id, name: "You" });

    for (const se of sharedExpenses) {
      const isCreator = se.createdByUserId === req.user.id;
      if (!userLookup.has(se.createdByUserId)) userLookup.set(se.createdByUserId, se.createdBy);

      for (const p of se.participants) {
        if (p.settled) continue;
        if (!userLookup.has(p.userId)) userLookup.set(p.userId, p.user);

        if (isCreator && p.userId !== req.user.id) {
          balancesMap.set(p.userId, (balancesMap.get(p.userId) || 0) - p.amountOwed);
          balancesMap.set(req.user.id, (balancesMap.get(req.user.id) || 0) + p.amountOwed);
        } else if (!isCreator && p.userId === req.user.id) {
          balancesMap.set(req.user.id, (balancesMap.get(req.user.id) || 0) - p.amountOwed);
          balancesMap.set(se.createdByUserId, (balancesMap.get(se.createdByUserId) || 0) + p.amountOwed);
        }
      }
    }

    const simplified = simplifyDebts(balancesMap);
    const transactions = simplified.map(t => ({
      from: userLookup.get(t.from),
      to: userLookup.get(t.to),
      amount: t.amount
    }));

    res.json({ success: true, data: { transactions } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:participantId/settle', async (req, res) => {
  try {
    const participant = await prisma.participant.findUnique({
      where: { id: req.params.participantId },
      include: { sharedExpense: true }
    });
    
    if (!participant) return res.status(404).json({ success: false, error: 'Participant record not found' });
    
    if (participant.sharedExpense.createdByUserId !== req.user.id && participant.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized to settle this record' });
    }

    const updated = await prisma.participant.update({
      where: { id: req.params.participantId },
      data: { settled: true }
    });
    
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/:id', [
  body('participants').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { id } = req.params;
    const { participants } = req.body;

    const sharedExpense = await prisma.sharedExpense.findFirst({
      where: { id, createdByUserId: req.user.id }
    });

    if (!sharedExpense) {
      return res.status(404).json({ success: false, error: 'Shared expense not found or unauthorized' });
    }

    await prisma.$transaction([
      prisma.participant.deleteMany({
        where: { sharedExpenseId: id }
      }),
      prisma.sharedExpense.update({
        where: { id },
        data: {
          participants: {
            create: participants.map(p => ({
              userId: p.userId,
              amountOwed: parseFloat(p.amountOwed),
              settled: false
            }))
          }
        }
      })
    ]);

    const updated = await prisma.sharedExpense.findUnique({
      where: { id },
      include: {
        expense: true,
        createdBy: { select: { id: true, name: true, email: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sharedExpense = await prisma.sharedExpense.findFirst({
      where: { id, createdByUserId: req.user.id }
    });

    if (!sharedExpense) {
      return res.status(404).json({ success: false, error: 'Shared expense not found or unauthorized' });
    }

    await prisma.sharedExpense.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Shared expense removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
