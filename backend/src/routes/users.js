import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';
import { sendEmailOTP, verifyEmailOTP } from '../utils/otp.js';

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware);

// Get current user profile with stats
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
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

    // Aggregate total expenses sum
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

// Update basic profile details (Name)
router.put('/profile', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { name } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData = {};
    if (name) updateData.name = name;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        createdAt: true
      }
    });

    res.json({ success: true, data: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Request OTP to change password
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

    const otp = await sendEmailOTP(user.email, 'CHANGE_PASSWORD');

    res.json({
      success: true,
      message: `Verification code sent to your registered email (${user.email})`,
      devCode: otp.code
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP and update password
router.put('/change-password-with-otp', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('otpCode').notEmpty().withMessage('6-digit verification code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { currentPassword, newPassword, otpCode } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }

    // Verify OTP
    const verification = await verifyEmailOTP(user.email, otpCode, 'CHANGE_PASSWORD');
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Request OTP to change email address
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

    const otp = await sendEmailOTP(normalizedNewEmail, 'CHANGE_EMAIL');

    res.json({
      success: true,
      message: `Verification code sent to ${normalizedNewEmail}`,
      devCode: otp.code
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify OTP and update email address
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

    // Verify OTP
    const verification = await verifyEmailOTP(normalizedNewEmail, otpCode, 'CHANGE_EMAIL');
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

    res.json({
      success: true,
      data: updatedUser,
      message: 'Email address updated successfully!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ success: true, data: [] });

    const users = await prisma.user.findMany({
      where: {
        email: { contains: email, mode: 'insensitive' },
        id: { not: req.user.id }
      },
      select: { id: true, name: true, email: true },
      take: 10
    });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
