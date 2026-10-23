import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export interface DatabaseContext {
  db: DatabaseSync;
  close: () => void;
}

export function initializeDatabase(dbPath?: string): DatabaseSync {
  const targetPath = dbPath || process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data', 'paisawise.db');

  if (targetPath !== ':memory:') {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec('PRAGMA foreign_keys = ON;');

  // Run migrations
  runMigrations(db);

  return db;
}

export function runMigrations(db: DatabaseSync) {
  db.exec(`
    -- 1. USERS TABLE
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. PROFILES TABLE
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      theme TEXT NOT NULL DEFAULT 'light',
      monthly_income_target REAL DEFAULT 0.00,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 3. OTPS TABLE
    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      purpose TEXT NOT NULL, -- 'signup_verification', 'password_reset'
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      expires_at TEXT NOT NULL,
      verified_at TEXT,
      created_at TEXT NOT NULL
    );

    -- 4. CATEGORIES TABLE
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT NOT NULL DEFAULT 'Tag',
      color TEXT NOT NULL DEFAULT '#10b981',
      created_at TEXT NOT NULL
    );

    -- 5. TRANSACTIONS TABLE
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      account_id TEXT,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL CHECK(amount > 0),
      currency TEXT NOT NULL DEFAULT 'INR',
      title TEXT NOT NULL,
      description TEXT,
      transaction_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'UPI',
      receipt_path TEXT,
      notes TEXT,
      tags TEXT, -- JSON string array
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 6. BUDGETS TABLE
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      period TEXT NOT NULL DEFAULT 'monthly',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      alert_threshold INTEGER NOT NULL DEFAULT 80,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 7. SAVINGS GOALS TABLE
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL CHECK(target_amount > 0),
      current_amount REAL NOT NULL DEFAULT 0.00 CHECK(current_amount >= 0),
      target_date TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'in_progress',
      color TEXT NOT NULL DEFAULT '#10b981',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 8. RECURRING EXPENSES TABLE
    CREATE TABLE IF NOT EXISTS recurring_expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      frequency TEXT NOT NULL,
      next_due_date TEXT NOT NULL,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 9. SUBSCRIPTIONS TABLE
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      billing_cycle TEXT NOT NULL,
      next_billing_date TEXT NOT NULL,
      reminder_enabled INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      website_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 10. NOTIFICATIONS TABLE
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read_at TEXT,
      link TEXT,
      created_at TEXT NOT NULL
    );

    -- 11. GOOGLE SHEET CONNECTIONS TABLE
    CREATE TABLE IF NOT EXISTS google_sheet_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      spreadsheet_id TEXT NOT NULL,
      spreadsheet_name TEXT,
      selected_sheet_name TEXT NOT NULL DEFAULT 'PaisaWise_Transactions',
      sync_status TEXT NOT NULL DEFAULT 'idle',
      last_sync_at TEXT,
      last_error TEXT,
      row_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- INDEXES
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON otps(email, purpose);
    CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, transaction_date DESC);
    CREATE INDEX IF NOT EXISTS idx_tx_cat ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON savings_goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_recurring_user ON recurring_expenses(user_id);
  `);

  // Seed standard categories if empty
  seedCategories(db);
}

function seedCategories(db: DatabaseSync) {
  const row = db.prepare('SELECT COUNT(*) as count FROM categories WHERE user_id IS NULL').get() as { count: number };
  if (row && row.count > 0) return;

  const standardCategories = [
    { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f97316' },
    { id: 'cat-groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#84cc16' },
    { id: 'cat-transport', name: 'Transport', type: 'expense', icon: 'Car', color: '#06b6d4' },
    { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
    { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6' },
    { id: 'cat-utilities', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#eab308' },
    { id: 'cat-healthcare', name: 'Healthcare', type: 'expense', icon: 'Activity', color: '#ef4444' },
    { id: 'cat-education', name: 'Education', type: 'expense', icon: 'BookOpen', color: '#3b82f6' },
    { id: 'cat-housing', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#6366f1' },
    { id: 'cat-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'CreditCard', color: '#a855f7' },
    { id: 'cat-travel', name: 'Travel', type: 'expense', icon: 'Compass', color: '#14b8a6' },
    { id: 'cat-other-exp', name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },
    { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981' },
    { id: 'cat-freelance', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#059669' },
    { id: 'cat-business', name: 'Business', type: 'income', icon: 'Building', color: '#047857' },
    { id: 'cat-investments', name: 'Investments & Interest', type: 'income', icon: 'TrendingUp', color: '#3b82f6' },
    { id: 'cat-gifts', name: 'Gifts & Bonuses', type: 'income', icon: 'Gift', color: '#ec4899' },
    { id: 'cat-other-inc', name: 'Other Income', type: 'income', icon: 'DollarSign', color: '#64748b' },
  ];

  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO categories (id, user_id, name, type, icon, color, created_at)
    VALUES (?, NULL, ?, ?, ?, ?, ?)
  `);

  for (const cat of standardCategories) {
    insertStmt.run(cat.id, cat.name, cat.type, cat.icon, cat.color, now);
  }
}
