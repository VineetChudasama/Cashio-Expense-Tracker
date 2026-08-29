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

  console.log(`\n========================================`);
  console.log(`[EMAIL AUTH OTP - ${type}]`);
  console.log(`Recipient: ${normalizedEmail}`);
  console.log(`Supabase Auth: ${isSupabaseConfigured() ? 'ACTIVE (Sending via Supabase Auth)' : 'INACTIVE'}`);
  console.log(`Resend / Mailer: ACTIVE`);
  console.log(`Expires in: 10 minutes`);
  console.log(`========================================\n`);

  // Dispatch email in background without blocking API response
  (async () => {
    try {
      if (isSupabaseConfigured()) {
        console.log(`[SUPABASE AUTH] Dispatching ${type} verification to ${normalizedEmail}...`);
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

  return { code, expiresAt };
}

/**
 * Verify an OTP code for an email and type
 */
export async function verifyEmailOTP(email, code, type) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = code.toString().trim();

  // 1. Check local database record first
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
    // Delete used OTP
    await prisma.emailVerification.delete({ where: { id: record.id } });
    return { valid: true };
  }

  // 2. If Supabase is configured, verify with Supabase Auth
  if (isSupabaseConfigured()) {
    const supabaseCheck = await verifySupabaseEmailOTP(normalizedEmail, normalizedCode, type);
    if (supabaseCheck.valid) {
      await prisma.emailVerification.deleteMany({
        where: { email: normalizedEmail, type }
      });
      return { valid: true, supabaseData: supabaseCheck.data };
    }
  }

  return { valid: false, error: 'Invalid verification code. Please check and try again.' };
}
