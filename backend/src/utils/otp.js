import { PrismaClient } from '@prisma/client';
import { sendOtpEmail } from './mailer.js';
import { 
  isSupabaseConfigured, 
  signUpWithSupabase, 
  sendSupabasePasswordReset,
  sendSupabaseEmailChange,
  resendSupabaseOtp, 
  verifySupabaseEmailOTP 
} from './supabase.js';

import { 
  checkOtpLockout, 
  recordFailedOtpAttempt, 
  resetOtpAttempts 
} from './securityTracker.js';

const prisma = new PrismaClient();

/**
 * Generate a random 6-digit numeric OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create or replace an OTP record for an email and type and dispatch via email asynchronously
 */
export async function sendEmailOTP(email, type, extraData = {}) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if locked out
  const lockout = checkOtpLockout(normalizedEmail, type);
  if (lockout.isLocked) {
    throw new Error(`Too many incorrect OTP attempts. You are locked out for ${lockout.remainingMinutes} more minute(s).`);
  }

  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Clean up any existing OTPs for this email & purpose
  await prisma.emailVerification.deleteMany({
    where: { email: normalizedEmail, type }
  });

  // Store new OTP in database
  await prisma.emailVerification.create({
    data: {
      email: normalizedEmail,
      code,
      type,
      expiresAt
    }
  });

  // Log dispatch notice without revealing the OTP code
  console.log(`[EMAIL AUTH] OTP dispatched for ${type} to ${normalizedEmail} (Expires in 10m)`);

  // Dispatch email in background without blocking API response
  (async () => {
    try {
      if (isSupabaseConfigured()) {
        if (type === 'REGISTER' && extraData.password) {
          await signUpWithSupabase(normalizedEmail, extraData.password, extraData.name);
        } else if (type === 'CHANGE_PASSWORD') {
          await sendSupabasePasswordReset(normalizedEmail);
        } else if (type === 'CHANGE_EMAIL') {
          await sendSupabaseEmailChange(normalizedEmail);
        } else {
          await resendSupabaseOtp(normalizedEmail);
        }
      }
      // Also send rich HTML email directly via Resend / SMTP
      await sendOtpEmail(normalizedEmail, code, type);
    } catch (bgError) {
      console.warn('[EMAIL AUTH] Background email dispatch notice:', bgError.message);
    }
  })();

  return { success: true, expiresAt };
}

/**
 * Verify an OTP code for an email and type with 3-attempt limit and 10-minute lockout
 */
export async function verifyEmailOTP(email, code, type) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = code ? code.toString().trim() : '';

  // 1. Check if user is locked out
  const lockout = checkOtpLockout(normalizedEmail, type);
  if (lockout.isLocked) {
    return {
      valid: false,
      locked: true,
      remainingMinutes: lockout.remainingMinutes,
      error: `Too many incorrect attempts. Verification is locked for ${lockout.remainingMinutes} more minute(s).`
    };
  }

  const record = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      type,
      code: normalizedCode
    }
  });

  if (record) {
    if (new Date() > record.expiresAt) {
      await prisma.emailVerification.delete({ where: { id: record.id } });
      return { valid: false, error: 'Verification code has expired. Please request a new one.' };
    }
    await prisma.emailVerification.delete({ where: { id: record.id } });
    resetOtpAttempts(normalizedEmail, type);
    return { valid: true };
  }

  if (isSupabaseConfigured()) {
    const supabaseCheck = await verifySupabaseEmailOTP(normalizedEmail, normalizedCode, type);
    if (supabaseCheck.valid) {
      await prisma.emailVerification.deleteMany({
        where: { email: normalizedEmail, type }
      });
      resetOtpAttempts(normalizedEmail, type);
      return { valid: true, supabaseData: supabaseCheck.data };
    }
  }

  // 2. Track failed attempt
  const attemptResult = recordFailedOtpAttempt(normalizedEmail, type);
  if (attemptResult.locked) {
    // Invalidate any active code on 3rd failure
    await prisma.emailVerification.deleteMany({
      where: { email: normalizedEmail, type }
    });
    return {
      valid: false,
      locked: true,
      remainingMinutes: 10,
      error: 'Too many incorrect OTP attempts (3/3). You are temporarily locked out for 10 minutes.'
    };
  }

  return {
    valid: false,
    remainingAttempts: attemptResult.remainingAttempts,
    error: `Invalid verification code. ${attemptResult.remainingAttempts} attempt(s) remaining before a 10-minute lockout.`
  };
}
