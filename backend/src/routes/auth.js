import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

import { sendEmailOTP, verifyEmailOTP } from '../utils/otp.js';

router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { email, password, name } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists' });
      }
      // Update unverified user credentials
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { name, password: hashedPassword }
      });
    } else {
      user = await prisma.user.create({
        data: { email: normalizedEmail, password: hashedPassword, name, isVerified: false }
      });
    }

    const otp = await sendEmailOTP(normalizedEmail, 'REGISTER');

    res.json({
      success: true,
      requireVerification: true,
      email: normalizedEmail,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`,
      devCode: otp.code
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/verify-register-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('code').notEmpty().withMessage('Verification code is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { email, code } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const verification = await verifyEmailOTP(normalizedEmail, code, 'REGISTER');
    if (!verification.valid) {
      return res.status(400).json({ success: false, error: verification.error });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });

    const token = jwt.sign({ id: updatedUser.id, email: updatedUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = updatedUser;
    
    res.json({
      success: true,
      data: { user: userData, token },
      message: 'Email successfully verified!'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/resend-register-otp', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(404).json({ success: false, error: 'No account found with this email' });

    if (user.isVerified) {
      return res.status(400).json({ success: false, error: 'Account is already verified' });
    }

    const otp = await sendEmailOTP(normalizedEmail, 'REGISTER');

    res.json({
      success: true,
      message: `A new 6-digit code has been sent to ${normalizedEmail}`,
      devCode: otp.code
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstErr = errors.array()[0]?.msg || 'Invalid input';
    return res.status(400).json({ success: false, error: firstErr });
  }

  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ success: false, error: 'No account found with this email address' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect password. Please try again' });
    }

    if (!user.isVerified) {
      const otp = await sendEmailOTP(user.email, 'REGISTER');
      return res.status(403).json({
        success: false,
        unverified: true,
        email: user.email,
        error: 'Your email address is not verified. A verification code has been sent to your email.',
        devCode: otp.code
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userData } = user;
    res.json({ success: true, data: { user: userData, token } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const { password: _, ...userData } = user;
    res.json({ success: true, data: userData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/check-email', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'Email query parameter required' });

    const user = await prisma.user.findUnique({
      where: { email: email.toString().toLowerCase() },
      select: { id: true, name: true }
    });

    res.json({
      success: true,
      exists: Boolean(user),
      name: user ? user.name : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
