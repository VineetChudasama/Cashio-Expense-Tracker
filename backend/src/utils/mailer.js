import nodemailer from 'nodemailer';

let transporter = null;

/**
 * Initialize nodemailer transporter based on environment configuration
 */
async function getTransporter() {
  if (transporter) return transporter;

  const { EMAIL_SERVICE, EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  // 1. If standard Gmail or service is configured
  if (EMAIL_SERVICE && EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: EMAIL_SERVICE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });
    return transporter;
  }

  // 2. If custom SMTP credentials are provided
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || '587', 10),
      secure: SMTP_PORT === '465',
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    return transporter;
  }

  // 3. Fallback: Ethereal test account for real SMTP simulation with web preview
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[MAILER] Initialized with test SMTP (Ethereal). Configure EMAIL_USER and EMAIL_PASS in .env for production sending.');
    return transporter;
  } catch (err) {
    console.error('[MAILER] Failed to create test transporter:', err.message);
    return null;
  }
}

/**
 * Send an OTP verification email with rich HTML formatting
 */
export async function sendOtpEmail(toEmail, code, type = 'REGISTER') {
  try {
    const mailTransporter = await getTransporter();
    if (!mailTransporter) {
      console.warn('[MAILER] No email transporter available.');
      return { success: false };
    }

    const typeTitles = {
      REGISTER: 'Verify Your Flow Account',
      CHANGE_PASSWORD: 'Password Change Verification',
      CHANGE_EMAIL: 'Confirm Your New Email Address'
    };

    const subject = `Flow Finance - ${typeTitles[type] || 'Verification Code'}`;
    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Flow Finance Security" <security@flow.app>';

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
            <span>FLOW</span>
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
            &copy; ${new Date().getFullYear()} Flow Intelligent Finance. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await mailTransporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: `Your Flow verification code is: ${code}. It expires in 10 minutes.`,
      html
    });

    console.log(`[MAILER] Email sent to ${toEmail} (MessageId: ${info.messageId})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MAILER] Web Email Preview: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[MAILER] Failed to send email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
}
