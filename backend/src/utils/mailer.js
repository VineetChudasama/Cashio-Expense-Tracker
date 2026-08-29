import nodemailer from 'nodemailer';

let transporter = null;
let etherealAttempted = false;

/**
 * Helper with timeout to prevent hanging on network/SMTP connections
 */
function withTimeout(promise, ms = 4000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Email dispatch timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

/**
 * Send email via Resend HTTP REST API if RESEND_API_KEY is configured
 */
async function sendViaResend(toEmail, subject, html, text) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  try {
    const fromAddress = process.env.EMAIL_FROM || 'Cashio Security <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [toEmail],
        subject,
        html,
        text
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[RESEND] Email sent successfully to ${toEmail} (ID: ${data.id})`);
      return { success: true, messageId: data.id };
    } else {
      console.warn('[RESEND] API Error:', data);
      return { success: false, error: data.message };
    }
  } catch (err) {
    console.warn('[RESEND] Fetch Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Initialize nodemailer transporter based on environment configuration
 */
async function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // 1. If standard Gmail or service is configured
  if (EMAIL_SERVICE && EMAIL_USER && EMAIL_PASS) {
    try {
      transporter = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        },
        pool: true,
        maxConnections: 3
      });
      return transporter;
    } catch (e) {
      console.warn('[MAILER] Gmail transporter error:', e.message);
    }
  }

  // 2. If custom SMTP credentials are provided
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587', 10),
        secure: SMTP_PORT === '465',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 5000
      });
      return transporter;
    } catch (e) {
      console.warn('[MAILER] Custom SMTP transporter error:', e.message);
    }
  }

  // 3. Fallback: Ethereal test account (with fast timeout)
  if (!etherealAttempted) {
    etherealAttempted = true;
    try {
      const testAccount = await withTimeout(nodemailer.createTestAccount(), 2500);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        },
        connectionTimeout: 3000,
        greetingTimeout: 3000,
        socketTimeout: 4000
      });
      return transporter;
    } catch (err) {
      return null;
    }
  }

  return null;
}

/**
 * Send an OTP verification email with rich HTML formatting
 */
export async function sendOtpEmail(toEmail, code, type = 'REGISTER') {
  const typeTitles = {
    REGISTER: 'Verify Your Cashio Account',
    CHANGE_PASSWORD: 'Password Change Verification',
    CHANGE_EMAIL: 'Confirm Your New Email Address'
  };

  const subject = `Cashio - ${typeTitles[type] || 'Verification Code'}`;
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Cashio Security" <onboarding@resend.dev>';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #030F0D; color: #F8FAFC; margin: 0; padding: 20px; }
        .container { max-width: 520px; margin: 0 auto; background: #06231E; border: 1px solid rgba(110, 231, 183, 0.25); border-radius: 20px; padding: 36px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
        .logo { text-align: center; margin-bottom: 24px; }
        .logo span { font-size: 28px; font-weight: 900; color: #10B981; letter-spacing: 2px; }
        .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.4); color: #6EE7B7; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
        h2 { color: #FFFFFF; font-size: 22px; margin-top: 0; margin-bottom: 10px; text-align: center; }
        p { color: #94D3C7; font-size: 14px; line-height: 1.6; text-align: center; }
        .code-box { background: #02120F; border: 1px solid #10B981; border-radius: 14px; padding: 18px; text-align: center; margin: 28px 0; }
        .code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #34D399; font-family: monospace; }
        .footer { margin-top: 32px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; text-align: center; font-size: 12px; color: #64748B; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <span>CASHIO</span>
        </div>
        <div style="text-align: center;">
          <span class="badge">Security Authentication</span>
          <h2>${typeTitles[type] || 'Verification Code'}</h2>
          <p>Please enter the following 6-digit authentication code to complete your request:</p>
        </div>
        <div class="code-box">
          <div class="code">${code}</div>
        </div>
        <p style="font-size: 12px; color: #94A3B8;">This code is confidential and will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Cashio Smart Expense Tracker. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `Your Cashio verification code is: ${code}. It expires in 10 minutes.`;

  // 1. Try Resend if configured
  if (process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResend(toEmail, subject, html, text);
    if (resendResult && resendResult.success) return resendResult;
  }

  // 2. Try Nodemailer SMTP (Gmail / Custom SMTP / Ethereal)
  try {
    const mailTransporter = await getTransporter();
    if (!mailTransporter) {
      return { success: false, reason: 'No active email transporter configured' };
    }

    const sendPromise = mailTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text,
      html
    });

    const info = await withTimeout(sendPromise, 4000);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn(`[MAILER] Email delivery note for ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}
