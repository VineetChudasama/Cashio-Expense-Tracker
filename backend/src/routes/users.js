import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmailOTP, verifyEmailOTP } from '../utils/otp.js';
import { validatePasswordStrength } from '../utils/passwordValidator.js';
import { createNotification } from '../utils/notifications.js';
import { fetchLiveExchangeRate } from '../utils/exchangeRates.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            expenses: true,
            sharedExpenses: true,
            participations: true
          }
        }
      }
    });

    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const expenseAgg = await prisma.expense.aggregate({
      where: { userId: req.user.id },
      _sum: { amount: true }
    });

    // Check for unsettled debts
    const userDebts = await prisma.participant.findMany({
      where: { userId: req.user.id, settled: false }
    });

    const createdShared = await prisma.sharedExpense.findMany({
      where: { createdByUserId: req.user.id },
      include: {
        participants: {
          where: { settled: false }
        }
      }
    });

    const debtsOwedByOthers = createdShared.flatMap(s => s.participants.filter(p => p.userId !== req.user.id));
    const totalOwedByUser = userDebts.reduce((sum, p) => sum + p.amountOwed, 0);
    const totalOwedToUser = debtsOwedByOthers.reduce((sum, p) => sum + p.amountOwed, 0);
    const totalUnsettledCount = userDebts.length + debtsOwedByOthers.length;

    res.json({
      success: true,
      data: {
        ...user,
        totalSpent: expenseAgg._sum.amount || 0,
        hasUnsettledDebts: totalUnsettledCount > 0,
        unsettledCount: totalUnsettledCount,
        totalOwedByUser,
        totalOwedToUser
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = (req.query.email || req.query.query || req.query.q || '').trim();
    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const matchedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true
      },
      take: 10
    });

    const results = matchedUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isVerified: u.isVerified,
      isSelf: u.id === req.user.id
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('[USER SEARCH ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/profile', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('currency').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { name, currency, convertExpenses, conversionRate, fromCurrency } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (currency) updateData.currency = currency;

    // If user requested to convert existing expenses to the new currency using exchange rate
    let convertedCount = 0;
    if (convertExpenses && currency) {
      const sourceCurrency = fromCurrency || user.currency || 'USD ($)';
      let rate = Number(conversionRate);
      if (!rate || isNaN(rate) || rate <= 0) {
        rate = await fetchLiveExchangeRate(sourceCurrency, currency);
      }

      if (rate && rate > 0) {
        const userExpenses = await prisma.expense.findMany({
          where: { userId: req.user.id }
        });

        for (const exp of userExpenses) {
          const newAmount = Math.round(exp.amount * rate * 100) / 100;
          await prisma.expense.update({
            where: { id: exp.id },
            data: { amount: newAmount }
          });
        }
        convertedCount = userExpenses.length;

        // Convert participant owed amounts for this user
        const userParticipants = await prisma.participant.findMany({
          where: { userId: req.user.id }
        });
        for (const part of userParticipants) {
          const newOwed = Math.round(part.amountOwed * rate * 100) / 100;
          await prisma.participant.update({
            where: { id: part.id },
            data: { amountOwed: newOwed }
          });
        }

        // Also convert participants in shared expenses created by this user
        const createdShared = await prisma.sharedExpense.findMany({
          where: { createdByUserId: req.user.id },
          include: { participants: true }
        });
        for (const shared of createdShared) {
          for (const part of shared.participants) {
            const newOwed = Math.round(part.amountOwed * rate * 100) / 100;
            await prisma.participant.update({
              where: { id: part.id },
              data: { amountOwed: newOwed }
            });
          }
        }

        // Also convert recurring patterns
        const userPatterns = await prisma.recurringPattern.findMany({
          where: { userId: req.user.id }
        });
        for (const pat of userPatterns) {
          const newAvg = Math.round(pat.avgAmount * rate * 100) / 100;
          await prisma.recurringPattern.update({
            where: { id: pat.id },
            data: { avgAmount: newAvg }
          });
        }

        createNotification({
          userId: req.user.id,
          type: 'SYSTEM',
          title: '💱 Currency & Expenses Converted',
          message: `Successfully converted ${convertedCount} past expenses to ${currency} at market rate (x${rate.toFixed(4)}).`,
          link: '/expenses'
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: updatedUser,
      convertedExpensesCount: convertedCount,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('[PROFILE UPDATE ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/convert-currency', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, conversionRate } = req.body;
    if (!toCurrency) {
      return res.status(400).json({ success: false, error: 'Target currency is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const sourceCurrency = fromCurrency || user.currency || 'USD ($)';
    let rate = Number(conversionRate);
    if (!rate || isNaN(rate) || rate <= 0) {
      rate = await fetchLiveExchangeRate(sourceCurrency, toCurrency);
    }

    if (!rate || rate <= 0) {
      return res.status(400).json({ success: false, error: 'Unable to determine a valid exchange rate' });
    }

    const userExpenses = await prisma.expense.findMany({
      where: { userId: req.user.id }
    });

    for (const exp of userExpenses) {
      const newAmount = Math.round(exp.amount * rate * 100) / 100;
      await prisma.expense.update({
        where: { id: exp.id },
        data: { amount: newAmount }
      });
    }

    // Convert participants and recurring patterns as well
    const userParticipants = await prisma.participant.findMany({
      where: { userId: req.user.id }
    });
    for (const part of userParticipants) {
      const newOwed = Math.round(part.amountOwed * rate * 100) / 100;
      await prisma.participant.update({
        where: { id: part.id },
        data: { amountOwed: newOwed }
      });
    }

    const createdShared = await prisma.sharedExpense.findMany({
      where: { createdByUserId: req.user.id },
      include: { participants: true }
    });
    for (const shared of createdShared) {
      for (const part of shared.participants) {
        const newOwed = Math.round(part.amountOwed * rate * 100) / 100;
        await prisma.participant.update({
          where: { id: part.id },
          data: { amountOwed: newOwed }
        });
      }
    }

    const userPatterns = await prisma.recurringPattern.findMany({
      where: { userId: req.user.id }
    });
    for (const pat of userPatterns) {
      const newAvg = Math.round(pat.avgAmount * rate * 100) / 100;
      await prisma.recurringPattern.update({
        where: { id: pat.id },
        data: { avgAmount: newAvg }
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { currency: toCurrency },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        isVerified: true,
        createdAt: true
      }
    });

    createNotification({
      userId: req.user.id,
      type: 'SYSTEM',
      title: '💱 Currency & Expenses Converted',
      message: `Successfully converted ${userExpenses.length} past expenses to ${toCurrency} at market rate (x${rate.toFixed(4)}).`,
      link: '/expenses'
    });

    res.json({
      success: true,
      rate,
      convertedExpensesCount: userExpenses.length,
      data: updatedUser,
      message: `Successfully converted all ${userExpenses.length} expenses to ${toCurrency} at live rate (${rate.toFixed(4)})!`
    });
  } catch (err) {
    console.error('[CONVERT CURRENCY ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/send-password-otp', [
  body('currentPassword').notEmpty().withMessage('Current password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { currentPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    await sendEmailOTP(user.email, 'CHANGE_PASSWORD');

    res.json({
      success: true,
      message: `Verification code sent to your registered email (${user.email})`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/change-password-with-otp', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required'),
  body('otpCode').notEmpty().withMessage('6-digit verification code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { currentPassword, newPassword, otpCode } = req.body;

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return res.status(400).json({ success: false, error: strengthCheck.error });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    const verification = await verifyEmailOTP(user.email, otpCode, 'CHANGE_PASSWORD');
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    createNotification({
      userId: req.user.id,
      type: 'SECURITY',
      title: 'Security Alert: Password Changed',
      message: 'Your account password was successfully updated. If you did not perform this change, please contact support immediately.',
      link: '/profile'
    });

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/send-email-otp', [
  body('newEmail').isEmail().withMessage('Please provide a valid new email address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { newEmail } = req.body;
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (normalizedNewEmail === user.email.toLowerCase()) {
      return res.status(400).json({ success: false, error: 'New email cannot be the same as current email' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedNewEmail }
    });
    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(400).json({ success: false, error: 'This email is already registered to another account' });
    }

    await sendEmailOTP(user.email, 'CHANGE_EMAIL');

    res.json({
      success: true,
      message: `Verification code sent to your registered email (${user.email})`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/change-email-with-otp', [
  body('newEmail').isEmail().withMessage('Please provide a valid new email address'),
  body('otpCode').notEmpty().withMessage('6-digit verification code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { newEmail, otpCode } = req.body;
    const normalizedNewEmail = newEmail.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const verification = await verifyEmailOTP(user.email, otpCode, 'CHANGE_EMAIL');
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { email: normalizedNewEmail },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        createdAt: true
      }
    });

    createNotification({
      userId: req.user.id,
      type: 'SECURITY',
      title: 'Security Alert: Email Updated',
      message: `Your account email address was successfully updated to ${normalizedNewEmail}.`,
      link: '/profile'
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'Email address updated successfully!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body || {};
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Incorrect password. Please try again.' });
      }
    }

    // Check for unsettled debts - User cannot delete account until all debts are settled!
    const userDebts = await prisma.participant.findMany({
      where: { userId: req.user.id, settled: false }
    });

    const createdShared = await prisma.sharedExpense.findMany({
      where: { createdByUserId: req.user.id },
      include: {
        participants: {
          where: { settled: false }
        }
      }
    });

    const debtsOwedByOthers = createdShared.flatMap(s => s.participants.filter(p => p.userId !== req.user.id));
    const totalUnsettledCount = userDebts.length + debtsOwedByOthers.length;

    if (totalUnsettledCount > 0) {
      const totalOwedByUser = userDebts.reduce((sum, p) => sum + p.amountOwed, 0);
      const totalOwedToUser = debtsOwedByOthers.reduce((sum, p) => sum + p.amountOwed, 0);
      
      const symbol = user?.currency?.includes('₹') ? '₹' : user?.currency?.includes('€') ? '€' : user?.currency?.includes('£') ? '£' : '$';

      let details = [];
      if (userDebts.length > 0) details.push(`you owe ${symbol}${totalOwedByUser.toFixed(2)} across ${userDebts.length} split(s)`);
      if (debtsOwedByOthers.length > 0) details.push(`others owe you ${symbol}${totalOwedToUser.toFixed(2)} across ${debtsOwedByOthers.length} split(s)`);

      return res.status(400).json({
        success: false,
        hasUnsettledDebts: true,
        error: `Cannot delete account: You have ${totalUnsettledCount} unsettled split debt(s) (${details.join('; ')}). Please settle all pending balances in the Splits tab before deleting your account.`
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.participant.deleteMany({
        where: { userId: req.user.id }
      });

      const userSharedExpenses = await tx.sharedExpense.findMany({
        where: { createdByUserId: req.user.id },
        select: { id: true }
      });
      const sharedExpenseIds = userSharedExpenses.map(s => s.id);
      if (sharedExpenseIds.length > 0) {
        await tx.participant.deleteMany({
          where: { sharedExpenseId: { in: sharedExpenseIds } }
        });
        await tx.sharedExpense.deleteMany({
          where: { id: { in: sharedExpenseIds } }
        });
      }

      await tx.recurringPattern.deleteMany({
        where: { userId: req.user.id }
      });

      await tx.expense.deleteMany({
        where: { userId: req.user.id }
      });

      await tx.emailVerification.deleteMany({
        where: { email: user.email }
      });

      await tx.user.delete({
        where: { id: req.user.id }
      });
    });

    res.json({
      success: true,
      message: 'Account and all associated financial records have been permanently deleted.'
    });
  } catch (err) {
    console.error('[DELETE ACCOUNT ERROR]:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
