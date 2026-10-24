import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authenticateToken, 
  createOtp, 
  verifyOtp, 
  getDevActiveOtp,
  AuthenticatedRequest 
} from './auth';
import { sendOtpEmail, checkEmailConfigured } from './mailer';
import { PaisaWiseDb, ensureDbAdapter } from './db';

export function createApp(rawDb: DatabaseSync | PaisaWiseDb | any) {
  const db = ensureDbAdapter(rawDb);
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'PaisaWise Backend API', timestamp: new Date().toISOString() });
  });

  // ============================================================================
  // GOOGLE SHEETS LIVE DATABASE SYNC ENDPOINTS
  // ============================================================================

  // 1. Live RFC-4180 CSV Stream directly from Database for Google Sheets =IMPORTDATA(...) formula
  app.get('/api/public/sheets-csv', async (req: Request, res: Response) => {
    try {
      const userId = (req.query.userId as string) || null;
      let query = `
        SELECT 
          t.id, 
          t.transaction_date, 
          t.type, 
          t.title, 
          COALESCE(c.name, 'General') as category_name, 
          t.amount, 
          t.payment_method, 
          COALESCE(t.notes, '') as notes
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
      `;
      const params: any[] = [];
      if (userId) {
        query += ` WHERE t.user_id = ?`;
        params.push(userId);
      }
      query += ` ORDER BY t.transaction_date DESC, t.created_at DESC`;

      let rows = await db.prepare(query).all(...params) as any[];

      // Fallback if user has no transactions yet: query all available or return structured default seed
      if (!rows || rows.length === 0) {
        rows = await db.prepare(`
          SELECT 
            t.id, 
            t.transaction_date, 
            t.type, 
            t.title, 
            COALESCE(c.name, 'General') as category_name, 
            t.amount, 
            t.payment_method, 
            COALESCE(t.notes, '') as notes
          FROM transactions t
          LEFT JOIN categories c ON t.category_id = c.id
          ORDER BY t.transaction_date DESC
          LIMIT 50
        `).all() as any[];
      }

      // If database is completely fresh, provide pre-seeded rows
      if (!rows || rows.length === 0) {
        rows = [
          { id: 'txn-101', transaction_date: '2026-10-24', type: 'expense', title: 'Reliance Smart Supermarket', category_name: 'Groceries', amount: 2450.00, payment_method: 'UPI', notes: 'Weekly grocery supplies' },
          { id: 'txn-102', transaction_date: '2026-10-23', type: 'expense', title: 'Apartment Monthly Rent', category_name: 'Rent & Housing', amount: 25000.00, payment_method: 'Net Banking', notes: 'October rent via NEFT' },
          { id: 'txn-103', transaction_date: '2026-10-22', type: 'income', title: 'Monthly Tech Salary', category_name: 'Salary', amount: 125000.00, payment_method: 'Net Banking', notes: 'Corporate salary direct credit' },
          { id: 'txn-104', transaction_date: '2026-10-21', type: 'expense', title: 'Jio Fiber Broadband', category_name: 'Bills & Utilities', amount: 999.00, payment_method: 'UPI', notes: 'High-speed internet recharge' },
          { id: 'txn-105', transaction_date: '2026-10-20', type: 'expense', title: 'Swiggy Gourmet Dinner', category_name: 'Food & Dining', amount: 840.00, payment_method: 'Credit Card', notes: 'Weekend family dinner' },
          { id: 'txn-106', transaction_date: '2026-10-19', type: 'expense', title: 'HDFC Ergo Health Insurance EMI', category_name: 'Healthcare & Meds', amount: 3500.00, payment_method: 'Net Banking', notes: 'Annual policy auto-debit' },
          { id: 'txn-107', transaction_date: '2026-10-18', type: 'income', title: 'Consulting Project Milestone', category_name: 'Freelance & Consulting', amount: 35000.00, payment_method: 'UPI', notes: 'UI architecture advisory' },
          { id: 'txn-108', transaction_date: '2026-10-17', type: 'expense', title: 'HP Petrol Pump Fuel', category_name: 'Transport & Fuel', amount: 2200.00, payment_method: 'UPI', notes: 'Full tank fuel' }
        ];
      }

      const headers = ['Transaction ID', 'Date', 'Type', 'Title', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
      const csvLines = [headers.join(',')];

      for (const r of rows) {
        const cleanId = String(r.id || '').replace(/"/g, '""');
        const cleanTitle = `"${String(r.title || '').replace(/"/g, '""')}"`;
        const cleanCategory = `"${String(r.category_name || 'General').replace(/"/g, '""')}"`;
        const cleanNotes = `"${String(r.notes || '').replace(/"/g, '""')}"`;
        const cleanAmount = Number(r.amount || 0).toFixed(2);
        const cleanType = String(r.type || 'EXPENSE').toUpperCase();
        const cleanPayment = String(r.payment_method || 'UPI');
        const rawDate = r.transaction_date;
        let cleanDate = new Date().toISOString().split('T')[0];
        if (rawDate) {
          try {
            const parsed = new Date(rawDate);
            if (!isNaN(parsed.getTime())) {
              cleanDate = parsed.toISOString().split('T')[0];
            } else {
              cleanDate = String(rawDate).split('T')[0];
            }
          } catch {
            cleanDate = String(rawDate).split('T')[0];
          }
        }

        csvLines.push([
          cleanId,
          cleanDate,
          cleanType,
          cleanTitle,
          cleanCategory,
          cleanAmount,
          cleanPayment,
          cleanNotes
        ].join(','));
      }

      const csvData = csvLines.join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="paisawise_database_ledger.csv"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).send(csvData);
    } catch (err: any) {
      console.error('[Google Sheets Public CSV Error]:', err);
      res.status(500).send('Error generating Google Sheets CSV from database');
    }
  });

  // 2. Live JSON API directly from Database for Google Apps Script
  app.get('/api/public/sheets-json', async (_req: Request, res: Response) => {
    try {
      const rows = await db.prepare(`
        SELECT 
          t.id, 
          t.transaction_date, 
          t.type, 
          t.title, 
          COALESCE(c.name, 'General') as category, 
          t.amount, 
          t.payment_method, 
          COALESCE(t.notes, '') as notes
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 200
      `).all() as any[];

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json({
        success: true,
        database: 'Supabase PostgreSQL',
        timestamp: new Date().toISOString(),
        count: rows.length,
        transactions: rows
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch database transactions for Google Sheets' });
    }
  });

  // 3. Webhook allowing Google Sheets / Apps Script to push new transactions into the database
  app.post('/api/public/sheets-webhook', async (req: Request, res: Response): Promise<void> => {
    try {
      const { transactions: incomingRows, userId = 'usr-demo' } = req.body;
      if (!Array.isArray(incomingRows) || incomingRows.length === 0) {
        res.status(400).json({ error: 'Expected non-empty transactions array.' });
        return;
      }

      let insertedCount = 0;
      const now = new Date().toISOString();

      await db.transaction(async (tx) => {
        for (const row of incomingRows) {
          if (!row.title || !row.amount) continue;
          const id = row.id || `txn-sheet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          const existing = await tx.prepare('SELECT id FROM transactions WHERE id = ?').get(id);
          if (!existing) {
            await tx.prepare(`
              INSERT INTO transactions (id, user_id, amount, currency, type, title, payment_method, transaction_date, notes, created_at, updated_at)
              VALUES (?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?)
            `).run(
              id,
              userId,
              parseFloat(row.amount),
              (row.type || 'expense').toLowerCase(),
              row.title.trim(),
              row.payment_method || 'UPI',
              row.date || now.split('T')[0],
              row.notes || null,
              now,
              now
            );
            insertedCount++;
          }
        }
      });

      res.json({
        success: true,
        message: `Successfully synchronized ${insertedCount} new transaction(s) from Google Sheets into the database!`,
        inserted: insertedCount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to process Google Sheets sync webhook' });
    }
  });

  // ============================================================================
  // AUTHENTICATION & EMAIL OTP ROUTES
  // ============================================================================
  const authRouter = express.Router();

  // POST /api/auth/send-otp (Simple real email OTP delivery)
  authRouter.post('/send-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, purpose = 'email_verification' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email address is required.' });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ error: 'Invalid email address format.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined;
      const userId = existingUser ? existingUser.id : null;

      // Generate secure 6-digit OTP
      const otpResult = await createOtp(db, userId, normalizedEmail, purpose);
      if (!otpResult.success) {
        res.status(429).json({ error: otpResult.error });
        return;
      }

      // Check if email service is configured on server
      const emailStatus = checkEmailConfigured();
      let emailDispatched = false;

      if (emailStatus.configured) {
        const emailResult = await sendOtpEmail(normalizedEmail, otpResult.otpCode!, purpose);
        emailDispatched = emailResult.sent;
      }

      console.log(`[PaisaWise Auth OTP] Code for ${normalizedEmail}: ${otpResult.otpCode} (Email delivered: ${emailDispatched})`);

      if (emailDispatched) {
        res.json({
          success: true,
          message: 'OTP sent to your email inbox.'
        });
      } else {
        res.json({
          success: true,
          message: emailStatus.configured 
            ? 'Email delivery could not be completed. Use the verification code below.'
            : 'Email service is not configured on the server. Use the verification code below.',
          devOtp: otpResult.otpCode
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error while sending OTP.' });
    }
  });

  // POST /api/auth/register
  authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({ error: 'Please provide full name, email, and password.' });
        return;
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        res.status(400).json({ error: 'Invalid email address format.' });
        return;
      }

      // Password length validation
      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters long.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Duplicate-account prevention
      const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined;
      if (existingUser) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }

      // Secure password hashing
      const passwordHash = await hashPassword(password);
      const userId = `usr-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date().toISOString();

      // Begin atomic transaction (uses FALSE for boolean compatibility)
      await db.transaction(async (tx) => {
        await tx.prepare(`
          INSERT INTO users (id, email, password_hash, full_name, email_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, FALSE, ?, ?)
        `).run(userId, normalizedEmail, passwordHash, fullName.trim(), now, now);

        await tx.prepare(`
          INSERT INTO profiles (id, full_name, currency, timezone, theme, monthly_income_target, created_at, updated_at)
          VALUES (?, ?, 'INR', 'Asia/Kolkata', 'light', 0.00, ?, ?)
        `).run(userId, fullName.trim(), now, now);
      });

      // Generate local OTP for signup verification
      const otpResult = await createOtp(db, userId, normalizedEmail, 'signup_verification');
      if (!otpResult.success) {
        res.status(400).json({ error: otpResult.error });
        return;
      }

      // Check server email configuration
      const emailStatus = checkEmailConfigured();
      let emailDispatched = false;

      if (emailStatus.configured) {
        const emailRes = await sendOtpEmail(normalizedEmail, otpResult.otpCode!, 'signup_verification');
        emailDispatched = emailRes.sent;
      }

      console.log(`[PaisaWise Signup OTP] Code for ${normalizedEmail}: ${otpResult.otpCode} (Email delivered: ${emailDispatched})`);

      res.status(201).json({
        success: true,
        message: emailDispatched 
          ? `Account created! Verification OTP sent to ${normalizedEmail}.` 
          : `Account created! (Email service not configured - use verification code: ${otpResult.otpCode})`,
        userId,
        email: normalizedEmail,
        requiresVerification: true,
        devOtp: emailDispatched ? undefined : otpResult.otpCode
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error during registration.' });
    }
  });

  // POST /api/auth/verify-otp
  authRouter.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp, otpCode, purpose = 'signup_verification' } = req.body;
      const code = otp || otpCode;

      if (!email || !code) {
        res.status(400).json({ error: 'Invalid OTP' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const result = await verifyOtp(db, normalizedEmail, code.toString(), purpose);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      const user = await db.prepare('SELECT id, email, full_name, email_verified FROM users WHERE email = ?').get(normalizedEmail) as {
        id: string;
        email: string;
        full_name: string;
        email_verified: boolean | number;
      } | undefined;

      const profile = user ? await db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id) : null;

      const token = user ? generateToken({
        id: user.id,
        email: user.email,
        full_name: user.full_name
      }) : null;

      res.json({
        success: true,
        message: 'Email verified successfully',
        token,
        user: user ? {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.full_name }
        } : undefined,
        profile
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Verification failed.' });
    }
  });

  // POST /api/auth/request-otp
  authRouter.post('/request-otp', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, purpose = 'signup_verification' } = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined;
      if (!user) {
        res.status(404).json({ error: 'No account found with this email address.' });
        return;
      }

      const otpResult = await createOtp(db, user.id, normalizedEmail, purpose);
      if (!otpResult.success) {
        res.status(429).json({ error: otpResult.error });
        return;
      }

      const emailStatus = checkEmailConfigured();
      let emailDispatched = false;

      if (emailStatus.configured) {
        const emailRes = await sendOtpEmail(normalizedEmail, otpResult.otpCode!, purpose);
        emailDispatched = emailRes.sent;
      }

      console.log(`[PaisaWise Request OTP] Code for ${normalizedEmail}: ${otpResult.otpCode} (Email delivered: ${emailDispatched})`);

      res.json({ 
        success: true, 
        message: emailDispatched 
          ? `New verification code dispatched to ${normalizedEmail}.` 
          : `New code generated! (Email service not configured - use code: ${otpResult.otpCode})`,
        devOtp: emailDispatched ? undefined : otpResult.otpCode
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to request OTP.' });
    }
  });

  // POST /api/auth/login
  authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Please enter both email and password.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as {
        id: string;
        email: string;
        password_hash: string;
        full_name: string;
        email_verified: boolean | number;
      } | undefined;

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      const isMatch = await comparePassword(password, user.password_hash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Verification check supporting both boolean (PostgreSQL) and integer 0/1 (SQLite)
      if (!user.email_verified || user.email_verified === 0) {
        // User has not verified their OTP yet
        const otpResult = await createOtp(db, user.id, normalizedEmail, 'signup_verification');
        let emailDispatched = false;
        if (otpResult.success) {
          const emailStatus = checkEmailConfigured();
          if (emailStatus.configured) {
            const emailRes = await sendOtpEmail(normalizedEmail, otpResult.otpCode!, 'signup_verification');
            emailDispatched = emailRes.sent;
          }
          console.log(`[PaisaWise Login OTP] Code for ${normalizedEmail}: ${otpResult.otpCode} (Email delivered: ${emailDispatched})`);
        }

        res.status(403).json({
          error: 'Email verification required.',
          requiresVerification: true,
          email: user.email,
          userId: user.id,
          devOtp: emailDispatched ? undefined : otpResult.otpCode
        });
        return;
      }

      const profile = await db.prepare('SELECT * FROM profiles WHERE id = ?').get(user.id);
      const token = generateToken({
        id: user.id,
        email: user.email,
        full_name: user.full_name
      });

      res.json({
        success: true,
        message: 'Signed in successfully.',
        token,
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.full_name }
        },
        profile
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed.' });
    }
  });

  // POST /api/auth/logout
  authRouter.post('/logout', (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // GET /api/auth/me
  authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await db.prepare('SELECT id, email, full_name, email_verified, created_at FROM users WHERE id = ?').get(userId) as any;
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      const profile = await db.prepare('SELECT * FROM profiles WHERE id = ?').get(userId);
      res.json({
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.full_name },
          email_verified: Boolean(user.email_verified)
        },
        profile
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch user.' });
    }
  });

  // POST /api/auth/forgot-password
  authRouter.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Email is required.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail) as { id: string } | undefined;
      if (!user) {
        // Return 200 without leaking account absence to prevent enumeration
        res.json({ success: true, message: 'If that email exists, recovery instructions have been dispatched.' });
        return;
      }

      const otpResult = await createOtp(db, user.id, normalizedEmail, 'password_reset');
      let emailDispatched = false;

      if (otpResult.success) {
        const emailStatus = checkEmailConfigured();
        if (emailStatus.configured) {
          const emailRes = await sendOtpEmail(normalizedEmail, otpResult.otpCode!, 'password_reset');
          emailDispatched = emailRes.sent;
        }
        console.log(`[PaisaWise ForgotPassword OTP] Code for ${normalizedEmail}: ${otpResult.otpCode} (Email delivered: ${emailDispatched})`);
      }

      res.json({ 
        success: true, 
        message: emailDispatched 
          ? 'Password recovery OTP dispatched to your email inbox.' 
          : `Password recovery code generated! Use code: ${otpResult.otpCode}`,
        devOtp: emailDispatched ? undefined : otpResult.otpCode
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to process password recovery.' });
    }
  });

  // POST /api/auth/reset-password
  authRouter.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otpCode, newPassword } = req.body;
      if (!email || !otpCode || !newPassword) {
        res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters long.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const verifyResult = await verifyOtp(db, normalizedEmail, otpCode.toString(), 'password_reset');
      if (!verifyResult.success) {
        res.status(400).json({ error: verifyResult.error });
        return;
      }

      const passwordHash = await hashPassword(newPassword);
      const now = new Date().toISOString();
      await db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?').run(passwordHash, now, normalizedEmail);

      res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update password.' });
    }
  });

  // Development/Automated Test Adapter for OTP
  authRouter.get('/dev-active-otp', async (req: Request, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const testSecret = req.headers['x-dev-test-token'];
    if (testSecret !== 'paisawise-internal-test-key') {
      res.status(403).json({ error: 'Unauthorized test access' });
      return;
    }
    const email = (req.query.email as string)?.trim().toLowerCase();
    const purpose = (req.query.purpose as string) || 'signup_verification';
    const otp = await getDevActiveOtp(db, email, purpose);
    res.json({ otp });
  });

  app.use('/api/auth', authRouter);

  // ============================================================================
  // CATEGORIES ROUTES
  // ============================================================================
  const categoriesRouter = express.Router();
  categoriesRouter.use(authenticateToken);

  // GET /api/categories
  categoriesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const categories = await db.prepare(`
        SELECT * FROM categories 
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY name ASC
      `).all(userId);
      res.json(categories);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch categories.' });
    }
  });

  // POST /api/categories
  categoriesRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, type, icon = 'Tag', color = '#10b981' } = req.body;

      if (!name || !type) {
        res.status(400).json({ error: 'Category name and type (income/expense) are required.' });
        return;
      }

      const id = `cat-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO categories (id, user_id, name, type, icon, color, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, name.trim(), type, icon, color, now);

      const created = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create category.' });
    }
  });

  app.use('/api/categories', categoriesRouter);

  // ============================================================================
  // TRANSACTIONS ROUTES
  // ============================================================================
  const transactionsRouter = express.Router();
  transactionsRouter.use(authenticateToken);

  // GET /api/transactions
  transactionsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { startDate, endDate, type, categoryId, search } = req.query;

      let query = `
        SELECT t.*, 
          c.name as category_name, c.type as category_type, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
      `;
      const params: any[] = [userId];

      if (startDate) {
        query += ' AND t.transaction_date >= ?';
        params.push(startDate);
      }
      if (endDate) {
        query += ' AND t.transaction_date <= ?';
        params.push(endDate);
      }
      if (type) {
        query += ' AND t.type = ?';
        params.push(type);
      }
      if (categoryId) {
        query += ' AND t.category_id = ?';
        params.push(categoryId);
      }
      if (search) {
        query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';

      const rows = await db.prepare(query).all(...params) as any[];

      // Transform into nested category structure matching frontend type
      const transactions = rows.map(r => ({
        id: r.id,
        user_id: r.user_id,
        account_id: r.account_id,
        category_id: r.category_id,
        type: r.type,
        amount: Number(r.amount),
        currency: r.currency,
        title: r.title,
        description: r.description,
        transaction_date: r.transaction_date,
        payment_method: r.payment_method,
        receipt_path: r.receipt_path,
        notes: r.notes,
        tags: r.tags ? (typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags) : [],
        created_at: r.created_at,
        updated_at: r.updated_at,
        category: r.category_id ? {
          id: r.category_id,
          name: r.category_name,
          type: r.category_type,
          icon: r.category_icon,
          color: r.category_color
        } : null
      }));

      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch transactions.' });
    }
  });

  // POST /api/transactions
  transactionsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { 
        type, 
        amount, 
        title, 
        category_id, 
        transaction_date, 
        payment_method = 'UPI', 
        description, 
        notes, 
        tags = [] 
      } = req.body;

      if (!type || amount === undefined || amount === null || !title) {
        res.status(400).json({ error: 'Transaction type, amount, and title are required.' });
        return;
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number.' });
        return;
      }

      const id = `tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const now = new Date().toISOString();
      const txDate = transaction_date || now.split('T')[0];

      await db.prepare(`
        INSERT INTO transactions (
          id, user_id, category_id, type, amount, currency, title, description,
          transaction_date, payment_method, notes, tags, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'INR', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        userId,
        category_id || null,
        type,
        numAmount,
        title.trim(),
        description || null,
        txDate,
        payment_method,
        notes || null,
        JSON.stringify(tags),
        now,
        now
      );

      const row = await db.prepare(`
        SELECT t.*, c.name as category_name, c.type as category_type, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).get(id) as any;

      res.status(201).json({
        ...row,
        amount: Number(row.amount),
        tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
        category: row.category_id ? {
          id: row.category_id,
          name: row.category_name,
          type: row.category_type,
          icon: row.category_icon,
          color: row.category_color
        } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create transaction.' });
    }
  });

  // PUT /api/transactions/:id
  transactionsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await db.prepare('SELECT user_id FROM transactions WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (existing.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to modify this transaction.' });
        return;
      }

      const { type, amount, title, category_id, transaction_date, payment_method, description, notes, tags } = req.body;
      const now = new Date().toISOString();

      await db.prepare(`
        UPDATE transactions SET
          type = COALESCE(?, type),
          amount = COALESCE(?, amount),
          title = COALESCE(?, title),
          category_id = COALESCE(?, category_id),
          transaction_date = COALESCE(?, transaction_date),
          payment_method = COALESCE(?, payment_method),
          description = COALESCE(?, description),
          notes = COALESCE(?, notes),
          tags = COALESCE(?, tags),
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        type || null,
        amount !== undefined ? Number(amount) : null,
        title || null,
        category_id || null,
        transaction_date || null,
        payment_method || null,
        description || null,
        notes || null,
        tags ? JSON.stringify(tags) : null,
        now,
        id,
        userId
      );

      const updated = await db.prepare(`
        SELECT t.*, c.name as category_name, c.type as category_type, c.icon as category_icon, c.color as category_color
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `).get(id) as any;

      res.json({
        ...updated,
        amount: Number(updated.amount),
        tags: updated.tags ? (typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags) : [],
        category: updated.category_id ? {
          id: updated.category_id,
          name: updated.category_name,
          type: updated.category_type,
          icon: updated.category_icon,
          color: updated.category_color
        } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update transaction.' });
    }
  });

  // DELETE /api/transactions/:id
  transactionsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await db.prepare('SELECT user_id FROM transactions WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Transaction not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (existing.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to delete this transaction.' });
        return;
      }

      await db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
      res.json({ success: true, message: 'Transaction deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete transaction.' });
    }
  });

  // POST /api/transactions/bulk-delete
  transactionsRouter.post('/bulk-delete', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'Array of transaction IDs required.' });
        return;
      }

      const placeholders = ids.map(() => '?').join(',');
      await db.prepare(`DELETE FROM transactions WHERE user_id = ? AND id IN (${placeholders})`).run(userId, ...ids);
      res.json({ success: true, count: ids.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to bulk-delete transactions.' });
    }
  });

  app.use('/api/transactions', transactionsRouter);

  // ============================================================================
  // BUDGETS ROUTES
  // ============================================================================
  const budgetsRouter = express.Router();
  budgetsRouter.use(authenticateToken);

  // GET /api/budgets
  budgetsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const rawBudgets = await db.prepare(`
        SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `).all(userId) as any[];

      // Calculate dynamic spent for each budget based on user transactions
      const budgets = await Promise.all(rawBudgets.map(async b => {
        let spentQuery = `
          SELECT COALESCE(SUM(amount), 0) as spent
          FROM transactions
          WHERE user_id = ? AND type = 'expense'
            AND transaction_date >= ? AND transaction_date <= ?
        `;
        const params: any[] = [userId, b.start_date, b.end_date];

        if (b.category_id) {
          spentQuery += ' AND category_id = ?';
          params.push(b.category_id);
        }

        const spentRow = await db.prepare(spentQuery).get(...params) as { spent: number } | undefined;
        const spent = spentRow ? spentRow.spent : 0;
        const amount = Number(b.amount);
        const remaining = Math.max(0, amount - spent);
        const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0;

        return {
          id: b.id,
          user_id: b.user_id,
          category_id: b.category_id,
          name: b.name,
          amount,
          period: b.period,
          start_date: b.start_date,
          end_date: b.end_date,
          alert_threshold: b.alert_threshold,
          spent,
          remaining,
          percentage,
          created_at: b.created_at,
          updated_at: b.updated_at,
          category: b.category_id ? {
            id: b.category_id,
            name: b.category_name,
            color: b.category_color,
            icon: b.category_icon
          } : null
        };
      }));

      res.json(budgets);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch budgets.' });
    }
  });

  // POST /api/budgets
  budgetsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, amount, category_id, period = 'monthly', start_date, end_date, alert_threshold = 80 } = req.body;

      if (!name || amount === undefined || !start_date || !end_date) {
        res.status(400).json({ error: 'Name, amount, start date, and end date are required.' });
        return;
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Budget amount must be a positive number.' });
        return;
      }

      const id = `b-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO budgets (id, user_id, category_id, name, amount, period, start_date, end_date, alert_threshold, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, category_id || null, name.trim(), numAmount, period, start_date, end_date, alert_threshold, now, now);

      const created = await db.prepare(`
        SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM budgets b
        LEFT JOIN categories c ON b.category_id = c.id
        WHERE b.id = ?
      `).get(id) as any;

      res.status(201).json({
        ...created,
        amount: Number(created.amount),
        spent: 0,
        remaining: Number(created.amount),
        percentage: 0,
        category: created.category_id ? {
          id: created.category_id,
          name: created.category_name,
          color: created.category_color,
          icon: created.category_icon
        } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create budget.' });
    }
  });

  // PUT /api/budgets/:id
  budgetsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await db.prepare('SELECT user_id FROM budgets WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Budget not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (existing.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to modify this budget.' });
        return;
      }

      const { name, amount, category_id, period, start_date, end_date, alert_threshold } = req.body;
      const now = new Date().toISOString();

      await db.prepare(`
        UPDATE budgets SET
          name = COALESCE(?, name),
          amount = COALESCE(?, amount),
          category_id = COALESCE(?, category_id),
          period = COALESCE(?, period),
          start_date = COALESCE(?, start_date),
          end_date = COALESCE(?, end_date),
          alert_threshold = COALESCE(?, alert_threshold),
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        name || null,
        amount !== undefined ? Number(amount) : null,
        category_id || null,
        period || null,
        start_date || null,
        end_date || null,
        alert_threshold || null,
        now,
        id,
        userId
      );

      const updated = await db.prepare('SELECT * FROM budgets WHERE id = ?').get(id) as any;
      res.json({ ...updated, amount: Number(updated.amount) });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update budget.' });
    }
  });

  // DELETE /api/budgets/:id
  budgetsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await db.prepare('SELECT user_id FROM budgets WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Budget not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (existing.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to delete this budget.' });
        return;
      }

      await db.prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?').run(id, userId);
      res.json({ success: true, message: 'Budget deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete budget.' });
    }
  });

  app.use('/api/budgets', budgetsRouter);

  // ============================================================================
  // SAVINGS GOALS ROUTES
  // ============================================================================
  const goalsRouter = express.Router();
  goalsRouter.use(authenticateToken);

  // GET /api/goals
  goalsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const goals = await db.prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY target_date ASC').all(userId) as any[];
      res.json(goals.map(g => ({
        ...g,
        target_amount: Number(g.target_amount),
        current_amount: Number(g.current_amount)
      })));
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch savings goals.' });
    }
  });

  // POST /api/goals
  goalsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { name, target_amount, current_amount = 0, target_date, description, color = '#10b981' } = req.body;

      if (!name || !target_amount || !target_date) {
        res.status(400).json({ error: 'Name, target amount, and target date are required.' });
        return;
      }

      const numTarget = Number(target_amount);
      const numCurrent = Number(current_amount);
      if (isNaN(numTarget) || numTarget <= 0) {
        res.status(400).json({ error: 'Target amount must be a positive number.' });
        return;
      }

      const id = `goal-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date().toISOString();
      const status = numCurrent >= numTarget ? 'completed' : 'in_progress';

      await db.prepare(`
        INSERT INTO savings_goals (id, user_id, name, target_amount, current_amount, target_date, description, status, color, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, userId, name.trim(), numTarget, numCurrent, target_date, description || null, status, color, now, now);

      const created = await db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
      res.status(201).json({
        ...created,
        target_amount: Number(created.target_amount),
        current_amount: Number(created.current_amount)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create savings goal.' });
    }
  });

  // PUT /api/goals/:id
  goalsRouter.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await db.prepare('SELECT user_id FROM savings_goals WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Savings goal not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (existing.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to modify this savings goal.' });
        return;
      }

      const { name, target_amount, current_amount, target_date, description, status, color } = req.body;
      const now = new Date().toISOString();

      await db.prepare(`
        UPDATE savings_goals SET
          name = COALESCE(?, name),
          target_amount = COALESCE(?, target_amount),
          current_amount = COALESCE(?, current_amount),
          target_date = COALESCE(?, target_date),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          color = COALESCE(?, color),
          updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(
        name || null,
        target_amount !== undefined ? Number(target_amount) : null,
        current_amount !== undefined ? Number(current_amount) : null,
        target_date || null,
        description || null,
        status || null,
        color || null,
        now,
        id,
        userId
      );

      const updated = await db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
      res.json({
        ...updated,
        target_amount: Number(updated.target_amount),
        current_amount: Number(updated.current_amount)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update savings goal.' });
    }
  });

  // POST /api/goals/:id/contribute
  goalsRouter.post('/:id/contribute', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { amount } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Contribution amount must be greater than zero.' });
        return;
      }

      const goal = await db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
      if (!goal) {
        res.status(404).json({ error: 'Savings goal not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (goal.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to contribute to this goal.' });
        return;
      }

      const newCurrent = Number(goal.current_amount) + numAmount;
      const newStatus = newCurrent >= Number(goal.target_amount) ? 'completed' : goal.status;
      const now = new Date().toISOString();

      await db.prepare('UPDATE savings_goals SET current_amount = ?, status = ?, updated_at = ? WHERE id = ?').run(
        newCurrent,
        newStatus,
        now,
        id
      );

      const updated = await db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id) as any;
      res.json({
        ...updated,
        target_amount: Number(updated.target_amount),
        current_amount: Number(updated.current_amount)
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to contribute to savings goal.' });
    }
  });

  // DELETE /api/goals/:id
  goalsRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const existing = await db.prepare('SELECT user_id FROM savings_goals WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (!existing) {
        res.status(404).json({ error: 'Savings goal not found.' });
        return;
      }

      // MULTI-TENANT ISOLATION CHECK
      if (existing.user_id !== userId) {
        res.status(403).json({ error: 'You do not have permission to delete this goal.' });
        return;
      }

      await db.prepare('DELETE FROM savings_goals WHERE id = ? AND user_id = ?').run(id, userId);
      res.json({ success: true, message: 'Savings goal deleted successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete savings goal.' });
    }
  });

  app.use('/api/goals', goalsRouter);

  // ============================================================================
  // RECURRING EXPENSES & SUBSCRIPTIONS ROUTES
  // ============================================================================
  const recurringRouter = express.Router();
  recurringRouter.use(authenticateToken);

  // GET /api/recurring
  recurringRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      const recurring = await db.prepare(`
        SELECT r.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM recurring_expenses r
        LEFT JOIN categories c ON r.category_id = c.id
        WHERE r.user_id = ?
        ORDER BY r.next_due_date ASC
      `).all(userId) as any[];

      const subscriptions = await db.prepare(`
        SELECT s.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM subscriptions s
        LEFT JOIN categories c ON s.category_id = c.id
        WHERE s.user_id = ?
        ORDER BY s.next_billing_date ASC
      `).all(userId) as any[];

      res.json({
        recurring: recurring.map(r => ({
          ...r,
          amount: Number(r.amount),
          reminder_enabled: Boolean(r.reminder_enabled),
          active: Boolean(r.active),
          category: r.category_id ? {
            id: r.category_id,
            name: r.category_name,
            color: r.category_color,
            icon: r.category_icon
          } : null
        })),
        subscriptions: subscriptions.map(s => ({
          ...s,
          amount: Number(s.amount),
          reminder_enabled: Boolean(s.reminder_enabled),
          active: Boolean(s.active),
          category: s.category_id ? {
            id: s.category_id,
            name: s.category_name,
            color: s.category_color,
            icon: s.category_icon
          } : null
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch recurring items.' });
    }
  });

  // POST /api/recurring
  recurringRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { title, name, amount, frequency, billing_cycle, next_due_date, next_billing_date, category_id, is_subscription = false } = req.body;

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than zero.' });
        return;
      }

      const now = new Date().toISOString();

      if (is_subscription) {
        const subName = name || title;
        if (!subName || !next_billing_date) {
          res.status(400).json({ error: 'Subscription name and next billing date required.' });
          return;
        }

        const id = `sub-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        await db.prepare(`
          INSERT INTO subscriptions (id, user_id, category_id, name, amount, billing_cycle, next_billing_date, reminder_enabled, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, ?, ?)
        `).run(id, userId, category_id || null, subName.trim(), numAmount, billing_cycle || 'monthly', next_billing_date, now, now);

        const created = await db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id);
        res.status(201).json(created);
      } else {
        const recTitle = title || name;
        if (!recTitle || !next_due_date) {
          res.status(400).json({ error: 'Recurring expense title and next due date required.' });
          return;
        }

        const id = `rec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
        await db.prepare(`
          INSERT INTO recurring_expenses (id, user_id, category_id, title, amount, frequency, next_due_date, reminder_enabled, active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, ?, ?)
        `).run(id, userId, category_id || null, recTitle.trim(), numAmount, frequency || 'monthly', next_due_date, now, now);

        const created = await db.prepare('SELECT * FROM recurring_expenses WHERE id = ?').get(id);
        res.status(201).json(created);
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create recurring item.' });
    }
  });

  // DELETE /api/recurring/:id
  recurringRouter.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      // Check in recurring_expenses
      const rec = await db.prepare('SELECT user_id FROM recurring_expenses WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (rec) {
        if (rec.user_id !== userId) {
          res.status(403).json({ error: 'You do not have permission to delete this recurring expense.' });
          return;
        }
        await db.prepare('DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true, message: 'Deleted successfully.' });
        return;
      }

      // Check in subscriptions
      const sub = await db.prepare('SELECT user_id FROM subscriptions WHERE id = ?').get(id) as { user_id: string } | undefined;
      if (sub) {
        if (sub.user_id !== userId) {
          res.status(403).json({ error: 'You do not have permission to delete this subscription.' });
          return;
        }
        await db.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').run(id, userId);
        res.json({ success: true, message: 'Deleted successfully.' });
        return;
      }

      res.status(404).json({ error: 'Item not found.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete item.' });
    }
  });

  app.use('/api/recurring', recurringRouter);

  // ============================================================================
  // DASHBOARD METRICS ROUTE
  // ============================================================================
  app.get('/api/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Aggregated figures
      const totalIncomeRow = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions WHERE user_id = ? AND type = 'income'
      `).get(userId) as { total: number } | undefined;

      const totalExpenseRow = await db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions WHERE user_id = ? AND type = 'expense'
      `).get(userId) as { total: number } | undefined;

      const totalIncome = totalIncomeRow ? totalIncomeRow.total : 0;
      const totalExpense = totalExpenseRow ? totalExpenseRow.total : 0;
      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

      // Recent 5 transactions
      const recentTransactions = await db.prepare(`
        SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ?
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT 5
      `).all(userId) as any[];

      // Category breakdown
      const categorySpending = await db.prepare(`
        SELECT c.id as category_id, COALESCE(c.name, 'Uncategorized') as category_name,
               c.color as category_color, c.icon as category_icon,
               SUM(t.amount) as amount, COUNT(t.id) as count
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'expense'
        GROUP BY c.id, c.name, c.color, c.icon
        ORDER BY amount DESC
      `).all(userId) as any[];

      // Active goals
      const goals = await db.prepare('SELECT * FROM savings_goals WHERE user_id = ? LIMIT 3').all(userId) as any[];

      res.json({
        summary: {
          totalIncome,
          totalExpense,
          netSavings,
          savingsRate
        },
        recentTransactions: recentTransactions.map(r => ({
          ...r,
          amount: Number(r.amount),
          category: r.category_id ? {
            id: r.category_id,
            name: r.category_name,
            color: r.category_color,
            icon: r.category_icon
          } : null
        })),
        categorySpending: categorySpending.map(c => ({
          ...c,
          amount: Number(c.amount),
          percentage: totalExpense > 0 ? Math.round((Number(c.amount) / totalExpense) * 100) : 0
        })),
        goals: goals.map(g => ({
          ...g,
          target_amount: Number(g.target_amount),
          current_amount: Number(g.current_amount)
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch dashboard metrics.' });
    }
  });

  // ============================================================================
  // GOOGLE SHEETS CONNECTION ROUTES
  // ============================================================================
  const sheetsRouter = express.Router();
  sheetsRouter.use(authenticateToken);

  sheetsRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const conn = await db.prepare('SELECT * FROM google_sheet_connections WHERE user_id = ?').get(userId);
      res.json(conn || null);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch sheets connection.' });
    }
  });

  sheetsRouter.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { spreadsheet_id, spreadsheet_name, selected_sheet_name = 'PaisaWise_Transactions' } = req.body;

      if (!spreadsheet_id) {
        res.status(400).json({ error: 'Spreadsheet ID is required.' });
        return;
      }

      const id = `sheet-${Date.now()}`;
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO google_sheet_connections (id, user_id, spreadsheet_id, spreadsheet_name, selected_sheet_name, sync_status, last_sync_at, row_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'idle', ?, 0, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          spreadsheet_id = excluded.spreadsheet_id,
          spreadsheet_name = excluded.spreadsheet_name,
          selected_sheet_name = excluded.selected_sheet_name,
          updated_at = excluded.updated_at
      `).run(id, userId, spreadsheet_id.trim(), spreadsheet_name || null, selected_sheet_name, now, now, now);

      const conn = await db.prepare('SELECT * FROM google_sheet_connections WHERE user_id = ?').get(userId);
      res.status(200).json(conn);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to connect sheet.' });
    }
  });

  sheetsRouter.delete('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      await db.prepare('DELETE FROM google_sheet_connections WHERE user_id = ?').run(userId);
      res.json({ success: true, message: 'Google Sheet disconnected.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to disconnect sheet.' });
    }
  });

  app.use('/api/sheets-connection', sheetsRouter);

  // ============================================================================
  // NOTIFICATIONS ROUTES
  // ============================================================================
  const notifRouter = express.Router();
  notifRouter.use(authenticateToken);

  notifRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const notifs = await db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').all(userId);
      res.json(notifs);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch notifications.' });
    }
  });

  notifRouter.post('/:id/read', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const now = new Date().toISOString();

      await db.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?').run(now, id, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to mark notification as read.' });
    }
  });

  notifRouter.post('/read-all', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const now = new Date().toISOString();
      await db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(now, userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to mark notifications as read.' });
    }
  });

  app.use('/api/notifications', notifRouter);

  return app;
}
