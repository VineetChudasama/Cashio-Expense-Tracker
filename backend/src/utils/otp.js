import { PrismaClient } from '@prisma/client';
import { sendOtpEmail } from './mailer.js';

const prisma = new PrismaClient();

/**
 * Generate a random 6-digit numeric OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create or replace an OTP record for an email and type and dispatch via email
 */
export async function sendEmailOTP(email, type) {
  const normalizedEmail = email.toLowerCase().trim();
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Clean up any existing OTPs for this email & purpose
  await prisma.emailVerification.deleteMany({
    where: { email: normalizedEmail, type }
  });

  // Store new OTP
  const verification = await prisma.emailVerification.create({
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
  console.log(`Verification Code: ${code}`);
  console.log(`Expires in: 10 minutes`);
  console.log(`========================================\n`);

  // Dispatch email in background
  const emailResult = await sendOtpEmail(normalizedEmail, code, type);

  return { code, expiresAt, emailResult };
}

/**
 * Verify an OTP code for an email and type
 */
export async function verifyEmailOTP(email, code, type) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = code.toString().trim();

  const record = await prisma.emailVerification.findFirst({
    where: {
      email: normalizedEmail,
      type,
      code: normalizedCode
    }
  });

  if (!record) {
    return { valid: false, error: 'Invalid verification code. Please check and try again.' };
  }

  if (new Date() > record.expiresAt) {
    await prisma.emailVerification.delete({ where: { id: record.id } });
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  // Delete used OTP
  await prisma.emailVerification.delete({ where: { id: record.id } });
  return { valid: true };
}
