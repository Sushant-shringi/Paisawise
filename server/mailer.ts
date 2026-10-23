import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

export interface EmailResult {
  sent: boolean;
  provider?: 'resend' | 'smtp' | 'test';
  messageId?: string;
  error?: string;
  userMessage?: string;
}

export function isTestEnv(): boolean {
  return process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST);
}

export function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath) && !isTestEnv()) {
    dotenv.config({ path: envPath, override: true });
  }
}

export interface EmailProviderStatus {
  configured: boolean;
  provider: 'resend' | 'smtp' | 'none';
  details: string;
}

/**
 * Checks server email configuration.
 * Only the application owner sets these on the server.
 * Normal users never see or configure these.
 */
export function checkEmailConfigured(): EmailProviderStatus {
  if (isTestEnv()) {
    return { configured: true, provider: 'smtp', details: 'Test environment active' };
  }
  loadEnvFile();

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    return { configured: true, provider: 'resend', details: 'Resend API Key configured' };
  }

  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  if (smtpUser && smtpPass) {
    return { configured: true, provider: 'smtp', details: `SMTP configured for ${smtpUser}` };
  }

  return { 
    configured: false, 
    provider: 'none', 
    details: 'Neither RESEND_API_KEY nor (SMTP_USER and SMTP_PASS) are set in server .env' 
  };
}

export function getTransporter(): nodemailer.Transporter | null {
  loadEnvFile();

  const user = process.env.SMTP_USER?.trim();
  // Strip spaces from Google App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;

  if (!user || !pass) {
    return null;
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }

  // Default to Gmail SMTP
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
}

export function initializeMailer(): void {
  const status = checkEmailConfigured();
  if (status.configured) {
    if (status.provider === 'resend') {
      console.log('[PaisaWise Mailer] Real email delivery enabled via Resend API.');
    } else if (status.provider === 'smtp') {
      console.log(`[PaisaWise Mailer] Real email delivery enabled via SMTP (${process.env.SMTP_USER}). Verifying connection...`);
      const transporter = getTransporter();
      if (transporter) {
        transporter.verify((err) => {
          if (err) {
            console.warn(`[PaisaWise Mailer] SMTP verification warning: ${err.message}`);
          } else {
            console.log(`[PaisaWise Mailer] SMTP connection verified successfully! Ready to deliver real emails to actual inboxes.`);
          }
        });
      }
    }
  } else {
    console.log(`[PaisaWise Mailer Server Notice] No email provider configured in server .env. (Owner setup: set RESEND_API_KEY or SMTP_PASS to deliver real emails).`);
  }
}

/**
 * Send OTP to user's real email inbox.
 * Normal users only provide their email.
 * Server dispatches using whichever provider the owner configured.
 */
export async function sendOtpEmail(
  toEmail: string,
  otpCode: string,
  purpose: string = 'email_verification'
): Promise<EmailResult> {
  if (isTestEnv()) {
    return { sent: true, provider: 'test', messageId: 'vitest-test-id' };
  }

  const status = checkEmailConfigured();
  if (!status.configured) {
    console.warn(`[PaisaWise Server Admin Warning] Email not dispatched to ${toEmail}: No server email credentials found in .env.`);
    return {
      sent: false,
      userMessage: 'Email delivery service is currently not available. Please contact support or try again later.',
      error: 'No email service configured on server.'
    };
  }

  const isReset = purpose === 'password_reset';
  const subject = isReset 
    ? `PaisaWise: Your Password Reset Code is ${otpCode}` 
    : `PaisaWise: Your Email Verification Code is ${otpCode}`;

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
          ${isReset ? 'Password Reset Verification' : 'Email Verification'}
        </h2>
        <p>Hello,</p>
        <p>${isReset 
          ? 'Enter the 6-digit verification code below to reset your PaisaWise account password:' 
          : 'Enter the 6-digit verification code below to verify your email address on PaisaWise:'}
        </p>
        <div class="otp-box">
          <div class="otp-code">${otpCode}</div>
          <div style="font-size: 11px; color: #a7f3d0; margin-top: 6px;">Valid for 10 minutes &bull; Single-use only</div>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          If you did not request this OTP, you can safely ignore this email.
        </p>
        <div class="footer">
          &copy; ${new Date().getFullYear()} PaisaWise &bull; Personal Finance Management
        </div>
      </div>
    </body>
    </html>
  `;
  const textContent = `Your PaisaWise verification code is: ${otpCode}. It is valid for 10 minutes and can only be used once.`;

  // Path 1: Resend HTTP API (Simplest transactional provider)
  if (status.provider === 'resend') {
    const resendApiKey = process.env.RESEND_API_KEY!.trim();
    const fromAddress = process.env.RESEND_FROM || 'PaisaWise Security <onboarding@resend.dev>';

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [toEmail],
          subject,
          html: htmlContent,
          text: textContent
        })
      });

      const data = await response.json() as any;
      if (!response.ok) {
        console.error(`[PaisaWise Mailer] Resend API error:`, data);
        return {
          sent: false,
          userMessage: 'Unable to deliver verification email at this moment. Please try again shortly.',
          error: data.message || 'Resend delivery failed'
        };
      }

      console.log(`[PaisaWise Mailer] Real email delivered via Resend to ${toEmail} (ID: ${data.id})`);
      return { sent: true, provider: 'resend', messageId: data.id };
    } catch (err: any) {
      console.error(`[PaisaWise Mailer] Resend request exception:`, err.message);
      return {
        sent: false,
        userMessage: 'Unable to deliver verification email at this moment. Please try again shortly.',
        error: err.message
      };
    }
  }

  // Path 2: SMTP / Gmail Nodemailer
  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      userMessage: 'Email delivery service is currently not available. Please contact support.',
      error: 'Unable to initialize email transporter.'
    };
  }

  try {
    const fromEmail = process.env.SMTP_USER;
    const fromAddress = process.env.SMTP_FROM || `"PaisaWise Security" <${fromEmail}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent
    });

    console.log(`[PaisaWise Mailer] Real email delivered via SMTP to ${toEmail} (Message ID: ${info.messageId})`);
    return { sent: true, provider: 'smtp', messageId: info.messageId };
  } catch (err: any) {
    console.error(`[PaisaWise Mailer] Failed to deliver email via SMTP:`, err.message);
    return { 
      sent: false, 
      userMessage: 'Failed to deliver verification email. Please try again shortly.',
      error: `SMTP delivery failed: ${err.message}` 
    };
  }
}
