import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

export interface EmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

export function getTransporter(): nodemailer.Transporter | null {
  loadEnvFile();

  const user = process.env.SMTP_USER?.trim();
  // Strip spaces from Google App Password (Google displays them as 4 groups of 4 letters)
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  if (user && pass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  return null;
}

export function initializeMailer(): void {
  const transporter = getTransporter();
  if (transporter) {
    const user = process.env.SMTP_USER;
    console.log(`[PaisaWise Mailer] Real email dispatch is ACTIVE for sender: ${user}`);
    transporter.verify((err) => {
      if (err) {
        console.warn(`[PaisaWise Mailer] SMTP verification warning: ${err.message}`);
      } else {
        console.log(`[PaisaWise Mailer] SMTP connection verified successfully! Ready to deliver real emails.`);
      }
    });
  } else {
    console.log('[PaisaWise Mailer] No SMTP credentials in .env. Falling back to local on-screen OTP display.');
  }
}

export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  purpose: 'signup_verification' | 'password_reset' = 'signup_verification'
): Promise<EmailResult> {
  const isReset = purpose === 'password_reset';
  const subject = isReset 
    ? `PaisaWise Security: Your Password Reset Code is ${otpCode}` 
    : `PaisaWise Security: Your Email Verification Code is ${otpCode}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #ffffff; margin: 0; padding: 24px; }
        .card { max-width: 480px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .logo { display: inline-block; font-size: 24px; font-weight: 900; color: #ffffff; text-decoration: none; }
        .logo span { color: #10b981; }
        .otp-box { background: #022c22; border: 2px dashed #10b981; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: 'Courier New', monospace; font-size: 38px; font-weight: 800; color: #34d399; letter-spacing: 8px; }
        .footer { font-size: 12px; color: #64748b; margin-top: 24px; text-align: center; line-height: 1.5; }
        p { color: #cbd5e1; font-size: 14px; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="text-align: center; margin-bottom: 20px;">
          <div class="logo">Paisa<span>Wise</span></div>
        </div>
        <h2 style="margin-top: 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">
          ${isReset ? 'Password Reset Verification' : 'Verify Your Email Address'}
        </h2>
        <p>Hello,</p>
        <p>${isReset 
          ? 'We received a request to reset the password for your PaisaWise account. Enter the verification code below to set your new password:' 
          : 'Thank you for registering with PaisaWise! To complete your registration and activate your account, enter this 6-digit verification code:'}
        </p>
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
          <div style="font-size: 11px; color: #a7f3d0; margin-top: 6px;">Expires in 10 minutes &bull; One-time use only</div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          If you did not request this code, you can safely ignore this email.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PaisaWise &bull; Track Your Money. Understand Your Habits.
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const fromEmail = process.env.SMTP_USER;
      const fromAddress = process.env.SMTP_FROM || `"PaisaWise Security" <${fromEmail}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        html: htmlContent,
        text: `Your PaisaWise verification code is: ${otpCode}. It expires in 10 minutes.`
      });

      console.log(`[PaisaWise Mailer] Real email delivered to ${toEmail} (ID: ${info.messageId})`);
      return { sent: true, messageId: info.messageId, provider: 'gmail-smtp' };
    } catch (err: any) {
      console.error(`[PaisaWise Mailer] Failed to deliver email via SMTP:`, err.message);
      return { sent: false, error: err.message };
    }
  }

  return { 
    sent: false, 
    error: 'SMTP not configured in .env. Falling back to local on-screen code display.' 
  };
}
