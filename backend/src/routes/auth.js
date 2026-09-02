import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import os from 'os';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

function extractClientIp(req) {
  let ip = req.headers['cf-connecting-ip'] 
    || req.headers['x-real-ip'] 
    || (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null)
    || req.ip 
    || req.socket?.remoteAddress 
    || '';

  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  if (ip === '::1' || ip === '127.0.0.1' || !ip) {
    try {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return `${iface.address} (Local Network)`;
          }
        }
      }
    } catch {}
    return '127.0.0.1 (Localhost / Device)';
  }

  return ip;
}

import { sendEmailOTP, verifyEmailOTP } from '../utils/otp.js';
import { validatePasswordStrength } from '../utils/passwordValidator.js';
import { 
  checkPasswordLockout, 
  recordFailedPasswordAttempt, 
  resetPasswordAttempts, 
  checkOtpLockout,
  ipRateLimiter 
} from '../utils/securityTracker.js';
import { sendFailedLoginSecurityAlert } from '../utils/mailer.js';

export const CATEGORY_MAX_LIMITS = {
  Rent: 100000,
  Education: 80000,
  Travel: 60000,
  Food: 50000,
  Shopping: 40000,
  Health: 35000,
  Utilities: 30000,
  Entertainment: 25000,
  Transport: 25000,
  Other: 20000
};
const DEFAULT_MAX_LIMIT = 100000;

router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: errors.array() });

  try {
    const { email, password, name, currency, categoryLimits } = req.body;

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.isValid) {
      return res.status(400).json({ success: false, error: strengthCheck.error });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    let user;

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists' });
      }
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { 
          name, 
          password: hashedPassword,
          currency: currency || existingUser.currency || 'USD ($)'
        }
      });
    } else {
      user = await prisma.user.create({
        data: { 
          email: normalizedEmail, 
          password: hashedPassword, 
          name, 
          currency: currency || 'USD ($)',
          isVerified: false 
        }
      });
    }

    // Save initial category spending limits if provided
    if (categoryLimits && typeof categoryLimits === 'object') {
      const entries = Array.isArray(categoryLimits)
        ? categoryLimits
        : Object.entries(categoryLimits).map(([cat, lim]) => ({ category: cat, limit: parseFloat(lim) }));

      for (const item of entries) {
        if (item.category && !isNaN(item.limit) && item.limit > 0) {
          const maxAllowed = CATEGORY_MAX_LIMITS[item.category] || DEFAULT_MAX_LIMIT;
          if (item.limit > maxAllowed) {
            return res.status(400).json({
              success: false,
              error: `Category limit for "${item.category}" cannot exceed ${maxAllowed.toLocaleString()}`
            });
          }
          await prisma.categoryLimit.upsert({
            where: {
              userId_category: {
                userId: user.id,
                category: item.category
              }
            },
            update: { limit: parseFloat(item.limit) },
            create: {
              userId: user.id,
              category: item.category,
              limit: parseFloat(item.limit)
            }
          }).catch(err => console.warn('[CATEGORY LIMIT ONBOARDING WARNING]:', err.message));
        }
      }
    }

    await sendEmailOTP(normalizedEmail, 'REGISTER', { password, name });

    res.json({
      success: true,
      requireVerification: true,
      email: normalizedEmail,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`
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
      const status = verification.locked ? 429 : 400;
      const remSec = verification.remainingSeconds || (verification.remainingMinutes ? verification.remainingMinutes * 60 : 600);
      return res.status(status).json({
        success: false,
        error: verification.error,
        locked: Boolean(verification.locked),
        remainingMinutes: verification.remainingMinutes,
        remainingSeconds: verification.locked ? remSec : undefined
      });
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

    const lockout = checkOtpLockout(normalizedEmail, 'REGISTER');
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        locked: true,
        remainingMinutes: lockout.remainingMinutes,
        remainingSeconds: lockout.remainingSeconds,
        error: `Account is temporarily locked due to too many failed OTP attempts. Please wait ${lockout.remainingMinutes} minute(s).`
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(404).json({ success: false, error: 'No account found with this email' });

    if (user.isVerified) {
      return res.status(400).json({ success: false, error: 'Account is already verified' });
    }

    await sendEmailOTP(normalizedEmail, 'REGISTER');

    res.json({
      success: true,
      message: `A new 6-digit code has been sent to ${normalizedEmail}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please enter a valid email address')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstErr = errors.array()[0]?.msg || 'Valid email is required';
    return res.status(400).json({ success: false, error: firstErr });
  }

  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const lockout = checkOtpLockout(normalizedEmail, 'CHANGE_PASSWORD');
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        locked: true,
        remainingMinutes: lockout.remainingMinutes,
        remainingSeconds: lockout.remainingSeconds,
        error: `Password reset is temporarily locked due to too many failed OTP attempts. Please wait ${lockout.remainingMinutes} minute(s).`
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account found with this email address' });
    }

    await sendEmailOTP(normalizedEmail, 'CHANGE_PASSWORD');

    res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/reset-password', [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('code').notEmpty().withMessage('Verification code is required'),
  body('newPassword').notEmpty().withMessage('New password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstErr = errors.array()[0]?.msg || 'All fields are required';
    return res.status(400).json({ success: false, error: firstErr });
  }

  try {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.isValid) {
      return res.status(400).json({ success: false, error: strengthCheck.error });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const verification = await verifyEmailOTP(normalizedEmail, code, 'CHANGE_PASSWORD');
    if (!verification.valid) {
      const status = verification.locked ? 429 : 400;
      const remSec = verification.remainingSeconds || (verification.remainingMinutes ? verification.remainingMinutes * 60 : 600);
      return res.status(status).json({
        success: false,
        error: verification.error,
        locked: Boolean(verification.locked),
        remainingMinutes: verification.remainingMinutes,
        remainingSeconds: verification.locked ? remSec : undefined
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password successfully reset! You can now log in with your new password.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', [
  ipRateLimiter({ maxRequests: 10, windowMs: 60000, message: 'Too many login attempts from this network. Please wait a minute.' }),
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
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if user is locked out due to prior failed password attempts
    const lockout = checkPasswordLockout(normalizedEmail);
    if (lockout.isLocked) {
      return res.status(429).json({
        success: false,
        locked: true,
        remainingMinutes: lockout.remainingMinutes,
        error: `Account temporarily locked due to 3 failed login attempts. Please try again in ${lockout.remainingMinutes} minute(s).`
      });
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(400).json({ success: false, error: 'No account found with this email address' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attemptResult = recordFailedPasswordAttempt(normalizedEmail);

      if (attemptResult.locked) {
        // Dispatched on 3rd failed attempt
        const clientIp = extractClientIp(req);
        sendFailedLoginSecurityAlert(user.email, {
          ip: clientIp,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('[SECURITY ALERT DISPATCH ERROR]:', err.message));

        return res.status(429).json({
          success: false,
          locked: true,
          remainingMinutes: 10,
          error: 'Too many failed login attempts (3/3). Your account has been temporarily locked for 10 minutes. A security alert email has been dispatched to your address.'
        });
      }

      return res.status(400).json({
        success: false,
        remainingAttempts: attemptResult.remainingAttempts,
        error: `Incorrect password. ${attemptResult.remainingAttempts} attempt(s) remaining before a 10-minute lockout.`
      });
    }

    // Reset attempts upon successful login
    resetPasswordAttempts(normalizedEmail);

    if (!user.isVerified) {
      await sendEmailOTP(user.email, 'REGISTER');
      return res.status(403).json({
        success: false,
        unverified: true,
        email: user.email,
        error: 'Your email address is not verified. A verification code has been sent to your email.'
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
      where: { email: email.toString().toLowerCase().trim() },
      select: { id: true }
    });

    // Zero leakage: never return the user's name or details to inspection
    res.json({
      success: true,
      exists: Boolean(user)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
