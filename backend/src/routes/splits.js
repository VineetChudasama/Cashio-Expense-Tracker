import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { simplifyDebts } from '../utils/debtSimplify.js';
import { createNotification } from '../utils/notifications.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.post('/', async (req, res) => {
  try {
    let { expenseId, amount, category, description, date, participants } = req.body;

    if (!Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one participant is required' });
    }

    let expense;
    if (expenseId) {
      expense = await prisma.expense.findFirst({
        where: { id: expenseId, userId: req.user.id }
      });
      if (!expense) return res.status(404).json({ success: false, error: 'Expense not found or unauthorized' });

      // Check if this expense has already been split
      const existingSplit = await prisma.sharedExpense.findUnique({
        where: { expenseId }
      });
      if (existingSplit) {
        return res.status(400).json({
          success: false,
          error: 'This transaction has already been split. You can edit the existing split in the Splits tab or choose an unsplit transaction.'
        });
      }
    } else {
      // Create the expense on-the-fly directly with sharing features!
      const expenseAmount = parseFloat(amount);
      if (!expenseAmount || isNaN(expenseAmount) || expenseAmount <= 0) {
        return res.status(400).json({ success: false, error: 'A valid positive expense amount is required' });
      }
      if (expenseAmount > 100000) {
        return res.status(400).json({ success: false, error: 'Maximum limit of 100,000 exceeded per expense created' });
      }

      expense = await prisma.expense.create({
        data: {
          userId: req.user.id,
          amount: expenseAmount,
          category: category || 'Other',
          description: description ? description.trim() : 'Shared Expense',
          date: date ? new Date(date) : new Date()
        }
      });
      expenseId = expense.id;
    }

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
      include: {
        expense: true,
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
        }
      }
    });

    // Trigger split notification for each participant
    const creator = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, currency: true }
    });

    const symbol = creator?.currency?.includes('₹') ? '₹' : creator?.currency?.includes('€') ? '€' : creator?.currency?.includes('£') ? '£' : '$';

    for (const p of participants) {
      if (p.userId !== req.user.id) {
        createNotification({
          userId: p.userId,
          type: 'SPLIT_CREATED',
          title: 'New Expense Split',
          message: `${creator?.name || 'A user'} split a ${symbol}${expense.amount.toFixed(2)} bill (${expense.description || expense.category}) with you. Your share is ${symbol}${parseFloat(p.amountOwed).toFixed(2)}.`,
          link: '/splits'
        });
      }
    }

    res.json({ success: true, data: sharedExpense });
  } catch (err) {
    console.error('[CREATE SPLIT ERROR]:', err);
    if (err.code === 'P2002' || (err.message && err.message.includes('Unique constraint failed'))) {
      return res.status(400).json({
        success: false,
        error: 'This transaction has already been split. You can edit the existing split in the Splits tab or choose an unsplit transaction.'
      });
    }
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
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
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
        participants: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        createdBy: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    const balances = new Map();

    for (const se of sharedExpenses) {
      const isCreator = se.createdByUserId === req.user.id;
      
      for (const p of se.participants) {
        if (p.settled) continue;
        
        if (isCreator && p.userId !== req.user.id) {
          const uName = p.user?.name || 'User';
          const uEmail = p.user?.email || '';
          const uAvatar = p.user?.avatar || null;
          const current = balances.get(p.userId) || {
            id: p.userId,
            name: uName,
            email: uEmail,
            avatar: uAvatar,
            user: { id: p.userId, name: uName, email: uEmail, avatar: uAvatar },
            amount: 0
          };
          current.amount += p.amountOwed;
          balances.set(p.userId, current);
        } else if (!isCreator && p.userId === req.user.id) {
          const uName = se.createdBy?.name || 'User';
          const uEmail = se.createdBy?.email || '';
          const uAvatar = se.createdBy?.avatar || null;
          const current = balances.get(se.createdByUserId) || {
            id: se.createdByUserId,
            name: uName,
            email: uEmail,
            avatar: uAvatar,
            user: { id: se.createdByUserId, name: uName, email: uEmail, avatar: uAvatar },
            amount: 0
          };
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
        participants: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
        createdBy: { select: { id: true, name: true, email: true, avatar: true } }
      }
    });

    const balancesMap = new Map();
    const userLookup = new Map();
    userLookup.set(req.user.id, { id: req.user.id, name: "You", avatar: req.user.avatar });

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
      from: userLookup.get(t.from) || { id: t.from, name: 'User' },
      to: userLookup.get(t.to) || { id: t.to, name: 'User' },
      fromUserId: t.from,
      toUserId: t.to,
      amount: t.amount
    }));

    res.json({ success: true, data: { transactions } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settle-transaction', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ success: false, error: 'fromUserId and toUserId are required' });
    }

    // Strict Security Rule: Only the receiver (toUserId) who receives the money can confirm and settle the amount!
    if (req.user.id !== toUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the receiver of the payment can confirm and mark this debt as settled.' 
      });
    }

    await prisma.participant.updateMany({
      where: {
        userId: fromUserId,
        settled: false,
        sharedExpense: { createdByUserId: toUserId }
      },
      data: { settled: true }
    });

    await prisma.participant.updateMany({
      where: {
        userId: toUserId,
        settled: false,
        sharedExpense: { createdByUserId: fromUserId }
      },
      data: { settled: true }
    });

    // Notify the debtor/payer that the receiver confirmed the settlement
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    createNotification({
      userId: fromUserId,
      type: 'SPLIT_SETTLED',
      title: 'Payment Received & Settled',
      message: `${currentUser?.name || 'Your friend'} confirmed receiving your payment and marked your balance as settled.`,
      link: '/splits'
    });

    res.json({ success: true, message: 'Settlement confirmed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/:targetId/settle', async (req, res) => {
  try {
    const { targetId } = req.params;

    const participant = await prisma.participant.findUnique({
      where: { id: targetId },
      include: { sharedExpense: { include: { expense: true } }, user: true }
    });
    
    if (participant) {
      // Strict Rule: Only the person who created/paid the original expense (the receiver of the money) can mark the participant settled
      if (participant.sharedExpense.createdByUserId !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          error: 'Only the receiver (the person who paid for the expense) can mark this debt as settled.' 
        });
      }

      const updated = await prisma.participant.update({
        where: { id: targetId },
        data: { settled: true }
      });

      // Notify the participant debtor
      const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true, currency: true } });
      const symbol = currentUser?.currency?.includes('₹') ? '₹' : currentUser?.currency?.includes('€') ? '€' : currentUser?.currency?.includes('£') ? '£' : '$';

      createNotification({
        userId: participant.userId,
        type: 'SPLIT_SETTLED',
        title: 'Split Debt Marked Settled',
        message: `${currentUser?.name || 'The expense creator'} marked your share of ${symbol}${participant.amountOwed.toFixed(2)} for ${participant.sharedExpense.expense.description || participant.sharedExpense.expense.category} as received and settled.`,
        link: '/splits'
      });

      return res.json({ success: true, data: updated });
    }

    await prisma.participant.updateMany({
      where: {
        userId: targetId,
        settled: false,
        sharedExpense: { createdByUserId: req.user.id }
      },
      data: { settled: true }
    });

    await prisma.participant.updateMany({
      where: {
        userId: req.user.id,
        settled: false,
        sharedExpense: { createdByUserId: targetId }
      },
      data: { settled: true }
    });

    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    createNotification({
      userId: targetId,
      type: 'SPLIT_SETTLED',
      title: 'Peer Debt Settled',
      message: `${currentUser?.name || 'A user'} marked all pending split balances as settled with you.`,
      link: '/splits'
    });

    res.json({ success: true, message: 'Settled successfully' });
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
        createdBy: { select: { id: true, name: true, email: true, avatar: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
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
