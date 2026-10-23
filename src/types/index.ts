export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 
  | 'UPI' 
  | 'Cash' 
  | 'Credit Card' 
  | 'Debit Card' 
  | 'Net Banking' 
  | 'Cheque' 
  | 'Other';

export type AccountType = 'cash' | 'bank' | 'savings' | 'credit_card' | 'investment' | 'other';

export type Frequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  monthly_income_target?: number;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  opening_balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string | null;
  category_id?: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  title: string;
  description?: string | null;
  transaction_date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  receipt_path?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
  account?: Account;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id?: string | null;
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  alert_threshold: number; // e.g. 80
  created_at: string;
  updated_at: string;
  category?: Category;
  // Computed client-side:
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description?: string | null;
  status: 'in_progress' | 'completed' | 'paused';
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  category_id?: string | null;
  title: string;
  amount: number;
  frequency: Frequency;
  next_due_date: string;
  reminder_enabled: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Subscription {
  id: string;
  user_id: string;
  category_id?: string | null;
  name: string;
  amount: number;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  next_billing_date: string;
  reminder_enabled: boolean;
  active: boolean;
  website_url?: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'budget_warning' | 'budget_exceeded' | 'recurring_due' | 'goal_milestone' | 'sync_status' | 'system';
  title: string;
  message: string;
  read_at?: string | null;
  link?: string | null;
  created_at: string;
}

export interface GoogleSheetConnection {
  id: string;
  user_id: string;
  spreadsheet_id: string;
  spreadsheet_name?: string | null;
  selected_sheet_name: string;
  sync_status: 'idle' | 'syncing' | 'success' | 'error';
  last_sync_at?: string | null;
  last_error?: string | null;
  row_count: number;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number; // percentage
  totalBudget: number;
  budgetSpent: number;
  budgetRemaining: number;
  budgetUtilizationPct: number;
  momIncomeChangePct: number;
  momExpenseChangePct: number;
  previousMonthExpense: number;
  previousMonthIncome: number;
}

export interface SpendingHealthScore {
  score: number; // 0 - 100
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  breakdown: {
    budgetAdherence: { score: number; weight: number; message: string };
    savingsRate: { score: number; weight: number; message: string };
    recurringBurden: { score: number; weight: number; message: string };
    volatility: { score: number; weight: number; message: string };
  };
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}
