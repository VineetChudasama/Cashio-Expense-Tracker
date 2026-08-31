import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmailOTP, verifyEmailOTP } from '../utils/otp.js';
import { validatePasswordStrength } from '../utils/passwordValidator.js';
import { createNotification } from '../utils/notifications.js';

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

    res.json({
      success: true,
      data: {
        ...user,
        totalSpent: expenseAgg._sum.amount || 0
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
    const { name, currency } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (currency) updateData.currency = currency;

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

    res.json({ success: true, data: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
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
