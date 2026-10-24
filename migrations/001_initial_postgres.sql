-- ============================================================================
-- PAISAWISE: Supabase PostgreSQL Initial Migration with Row Level Security (RLS)
-- Migration: 001_initial_postgres.sql
-- Target Database: Supabase PostgreSQL
-- Description: Creates all 11 core tables in the public schema with
--              referential integrity, indexes, seed data, and granular RLS policies.
-- Safe to rerun repeatedly (idempotent).
-- ============================================================================

-- Ensure public schema is active
SET search_path TO public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- HELPER FUNCTION: Resolve Current Authenticated User ID
-- Resolves user ID from Express session variable, PostgREST JWT claim, or Supabase auth.uid()
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_app_user_id() RETURNS TEXT AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_user_id', true), ''),
    NULLIF(current_setting('request.jwt.claim.sub', true), ''),
    (auth.uid())::text
  );
$$ LANGUAGE sql STABLE;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own record" ON public.users;
CREATE POLICY "Users can view their own record"
  ON public.users FOR SELECT
  USING (id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own record" ON public.users;
CREATE POLICY "Users can update their own record"
  ON public.users FOR UPDATE
  USING (id = public.current_app_user_id())
  WITH CHECK (id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id VARCHAR(64) PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  theme VARCHAR(32) NOT NULL DEFAULT 'light',
  monthly_income_target NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = public.current_app_user_id())
  WITH CHECK (id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 3. OTPS TABLE (Email Verification & Password Reset)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otps (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose VARCHAR(64) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;
-- Strict zero public access policy: No public policies exist for OTPs.
-- Only the backend connection (postgres / service_role) has access to OTPs.

-- ----------------------------------------------------------------------------
-- 4. CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(64) NOT NULL DEFAULT 'Tag',
  color VARCHAR(32) NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view system and their own categories" ON public.categories;
CREATE POLICY "Users can view system and their own categories"
  ON public.categories FOR SELECT
  USING (user_id IS NULL OR user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can create their own categories" ON public.categories;
CREATE POLICY "Users can create their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;
CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 5. TRANSACTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id VARCHAR(64),
  category_id VARCHAR(64) REFERENCES public.categories(id) ON DELETE SET NULL,
  type VARCHAR(16) NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'UPI',
  receipt_path TEXT,
  notes TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;
CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 6. BUDGETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id VARCHAR(64) REFERENCES public.categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  period VARCHAR(32) NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  alert_threshold INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
CREATE POLICY "Users can insert their own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;
CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 7. SAVINGS GOALS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  target_amount NUMERIC(12, 2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
  target_date DATE NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
  color VARCHAR(32) NOT NULL DEFAULT '#10b981',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own savings goals" ON public.savings_goals;
CREATE POLICY "Users can view their own savings goals"
  ON public.savings_goals FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own savings goals" ON public.savings_goals;
CREATE POLICY "Users can insert their own savings goals"
  ON public.savings_goals FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own savings goals" ON public.savings_goals;
CREATE POLICY "Users can update their own savings goals"
  ON public.savings_goals FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own savings goals" ON public.savings_goals;
CREATE POLICY "Users can delete their own savings goals"
  ON public.savings_goals FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 8. RECURRING EXPENSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recurring_expenses (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id VARCHAR(64) REFERENCES public.categories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  frequency VARCHAR(32) NOT NULL,
  next_due_date DATE NOT NULL,
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can view their own recurring expenses"
  ON public.recurring_expenses FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can insert their own recurring expenses"
  ON public.recurring_expenses FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can update their own recurring expenses"
  ON public.recurring_expenses FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own recurring expenses" ON public.recurring_expenses;
CREATE POLICY "Users can delete their own recurring expenses"
  ON public.recurring_expenses FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 9. SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id VARCHAR(64) REFERENCES public.categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  billing_cycle VARCHAR(32) NOT NULL,
  next_billing_date DATE NOT NULL,
  reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can delete their own subscriptions"
  ON public.subscriptions FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- 11. GOOGLE SHEET CONNECTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.google_sheet_connections (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  spreadsheet_id VARCHAR(255) NOT NULL,
  spreadsheet_name VARCHAR(255),
  selected_sheet_name VARCHAR(255) NOT NULL DEFAULT 'PaisaWise_Transactions',
  sync_status VARCHAR(32) NOT NULL DEFAULT 'idle',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.google_sheet_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sheet connection" ON public.google_sheet_connections;
CREATE POLICY "Users can view their own sheet connection"
  ON public.google_sheet_connections FOR SELECT
  USING (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can insert their own sheet connection" ON public.google_sheet_connections;
CREATE POLICY "Users can insert their own sheet connection"
  ON public.google_sheet_connections FOR INSERT
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can update their own sheet connection" ON public.google_sheet_connections;
CREATE POLICY "Users can update their own sheet connection"
  ON public.google_sheet_connections FOR UPDATE
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS "Users can delete their own sheet connection" ON public.google_sheet_connections;
CREATE POLICY "Users can delete their own sheet connection"
  ON public.google_sheet_connections FOR DELETE
  USING (user_id = public.current_app_user_id());

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_otps_email_purpose ON public.otps(email, purpose);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_cat ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON public.notifications(user_id, read_at);

-- ----------------------------------------------------------------------------
-- DEFAULT SEED DATA: STANDARD SYSTEM CATEGORIES
-- Safe for repeated runs via ON CONFLICT (id) DO NOTHING
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (id, user_id, name, type, icon, color, created_at)
VALUES 
  ('cat-food', NULL, 'Food & Dining', 'expense', 'Utensils', '#f97316', NOW()),
  ('cat-groceries', NULL, 'Groceries', 'expense', 'ShoppingBag', '#84cc16', NOW()),
  ('cat-transport', NULL, 'Transport', 'expense', 'Car', '#06b6d4', NOW()),
  ('cat-shopping', NULL, 'Shopping', 'expense', 'ShoppingBag', '#ec4899', NOW()),
  ('cat-entertainment', NULL, 'Entertainment', 'expense', 'Film', '#8b5cf6', NOW()),
  ('cat-utilities', NULL, 'Bills & Utilities', 'expense', 'Zap', '#eab308', NOW()),
  ('cat-healthcare', NULL, 'Healthcare', 'expense', 'Activity', '#ef4444', NOW()),
  ('cat-education', NULL, 'Education', 'expense', 'BookOpen', '#3b82f6', NOW()),
  ('cat-housing', NULL, 'Rent & Housing', 'expense', 'Home', '#6366f1', NOW()),
  ('cat-subscriptions', NULL, 'Subscriptions', 'expense', 'CreditCard', '#a855f7', NOW()),
  ('cat-travel', NULL, 'Travel', 'expense', 'Compass', '#14b8a6', NOW()),
  ('cat-other-exp', NULL, 'Other Expense', 'expense', 'MoreHorizontal', '#64748b', NOW()),
  ('cat-salary', NULL, 'Salary', 'income', 'Briefcase', '#10b981', NOW()),
  ('cat-freelance', NULL, 'Freelance', 'income', 'Laptop', '#059669', NOW()),
  ('cat-business', NULL, 'Business', 'income', 'Building', '#047857', NOW()),
  ('cat-investments', NULL, 'Investments & Interest', 'income', 'TrendingUp', '#3b82f6', NOW()),
  ('cat-gifts', NULL, 'Gifts & Bonuses', 'income', 'Gift', '#ec4899', NOW()),
  ('cat-other-inc', NULL, 'Other Income', 'income', 'DollarSign', '#64748b', NOW())
ON CONFLICT (id) DO NOTHING;
