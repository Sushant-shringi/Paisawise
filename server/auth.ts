import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { DatabaseSync } from 'node:sqlite';

const JWT_SECRET = process.env.JWT_SECRET || 'paisawise-super-secret-local-jwt-key-32chars!';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_SECONDS = 30;

export interface TokenPayload {
  id: string;
  email: string;
  full_name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Password hashing
export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// JWT Token generation
export function generateToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = payload;
  next();
}

// Local OTP Management
export function generateOtpCode(): string {
  // Cryptographically secure 6-digit numeric OTP
  return crypto.randomInt(100000, 999999).toString();
}

export function createOtp(
  db: DatabaseSync, 
  userId: string, 
  email: string, 
  purpose: 'signup_verification' | 'password_reset' = 'signup_verification'
): { success: boolean; error?: string; otpCode?: string } {
  // Check rate limit: Check recent OTP requests within RATE_LIMIT_SECONDS
  const recentOtp = db.prepare(`
    SELECT created_at FROM otps 
    WHERE email = ? AND purpose = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(email, purpose) as { created_at: string } | undefined;

  if (recentOtp) {
    const elapsedMs = Date.now() - new Date(recentOtp.created_at).getTime();
    if (elapsedMs < RATE_LIMIT_SECONDS * 1000) {
      const waitSec = Math.ceil((RATE_LIMIT_SECONDS * 1000 - elapsedMs) / 1000);
      return { success: false, error: `Please wait ${waitSec}s before requesting a new OTP.` };
    }
  }

  // Invalidate any existing active OTP for this email and purpose
  db.prepare(`
    UPDATE otps 
    SET verified_at = 'invalidated' 
    WHERE email = ? AND purpose = ? AND verified_at IS NULL
  `).run(email, purpose);

  const otpCode = generateOtpCode();
  const id = `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO otps (id, user_id, email, otp_code, purpose, attempts, max_attempts, expires_at, verified_at, created_at)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, NULL, ?)
  `).run(id, userId, email, otpCode, purpose, MAX_OTP_ATTEMPTS, expiresAt, now.toISOString());

  return { success: true, otpCode };
}

export function verifyOtp(
  db: DatabaseSync,
  email: string,
  enteredCode: string,
  purpose: 'signup_verification' | 'password_reset' = 'signup_verification'
): { success: boolean; error?: string; userId?: string } {
  const record = db.prepare(`
    SELECT * FROM otps 
    WHERE email = ? AND purpose = ? AND (verified_at IS NULL OR verified_at = '')
    ORDER BY created_at DESC LIMIT 1
  `).get(email, purpose) as {
    id: string;
    user_id: string;
    otp_code: string;
    attempts: number;
    max_attempts: number;
    expires_at: string;
  } | undefined;

  if (!record) {
    return { success: false, error: 'No active OTP found. Please request a new verification code.' };
  }

  // Check expiration
  if (Date.now() > new Date(record.expires_at).getTime()) {
    return { success: false, error: 'OTP has expired. Please request a new verification code.' };
  }

  // Check maximum attempts
  if (record.attempts >= record.max_attempts) {
    return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
  }

  // Check code match
  if (record.otp_code !== enteredCode.trim()) {
    const updatedAttempts = record.attempts + 1;
    db.prepare('UPDATE otps SET attempts = ? WHERE id = ?').run(updatedAttempts, record.id);
    const remaining = record.max_attempts - updatedAttempts;
    if (remaining <= 0) {
      return { success: false, error: 'Maximum attempts reached. This OTP is now locked. Please request a new OTP.' };
    }
    return { success: false, error: `Invalid verification code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.` };
  }

  // Success: mark verified
  const verifiedAt = new Date().toISOString();
  db.prepare('UPDATE otps SET verified_at = ? WHERE id = ?').run(verifiedAt, record.id);

  // If signup verification, mark user as verified
  if (purpose === 'signup_verification' && record.user_id) {
    db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').run(verifiedAt, record.user_id);
  }

  return { success: true, userId: record.user_id };
}

// Development and Automated Testing Adapter:
// NEVER available in production. Only for local test suites to obtain the OTP without public leakage.
export function getDevActiveOtp(db: DatabaseSync, email: string, purpose: string = 'signup_verification'): string | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  const row = db.prepare(`
    SELECT otp_code FROM otps 
    WHERE email = ? AND purpose = ? AND (verified_at IS NULL OR verified_at = '')
    ORDER BY created_at DESC LIMIT 1
  `).get(email, purpose) as { otp_code: string } | undefined;

  return row ? row.otp_code : null;
}
