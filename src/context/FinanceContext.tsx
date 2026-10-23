import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Transaction, 
  Category, 
  Budget, 
  SavingsGoal, 
  RecurringExpense, 
  Subscription, 
  NotificationItem, 
  GoogleSheetConnection,
  FinancialSummary,
  SpendingHealthScore
} from '@/types';
import { supabaseApi } from '@/lib/supabase/api';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  calculateFinancialSummary, 
  calculateCategorySpending, 
  calculateDailySpending,
  calculateRecurringCommitment,
  calculateSpendingHealthScore,
  generateExpenseInsights,
  filterTransactionsByDate,
  CategorySpending,
  DailySpending,
  InsightResult
} from '@/lib/calculations/financeCalculations';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface FinanceContextType {
  // State
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  recurringExpenses: RecurringExpense[];
  subscriptions: Subscription[];
  notifications: NotificationItem[];
  sheetConnection: GoogleSheetConnection | null;
  isLoading: boolean;
  
  // Date Filters
  dateRange: { startDate: string; endDate: string };
  setDateRange: (range: { startDate: string; endDate: string }) => void;
  resetToCurrentMonth: () => void;
  
  // Computed Data
  filteredTransactions: Transaction[];
  financialSummary: FinancialSummary;
  categorySpending: CategorySpending[];
  incomeCategoryBreakdown: CategorySpending[];
  dailySpending: DailySpending[];
  spendingHealth: SpendingHealthScore;
  expenseInsights: InsightResult[];
  recurringSummary: { monthlyTotal: number; yearlyTotal: number; activeCount: number };
  unreadNotificationCount: number;

  // Actions
  refreshAll: () => Promise<void>;
  createTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkDeleteTransactions: (ids: string[]) => Promise<void>;
  createCategory: (cat: Omit<Category, 'id'>) => Promise<Category>;
  createBudget: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  createGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) => Promise<SavingsGoal>;
  updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<SavingsGoal>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  createRecurring: (item: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) => Promise<RecurringExpense>;
  deleteRecurring: (id: string) => Promise<void>;
  createSubscription: (sub: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  saveSheetConnection: (conn: Omit<GoogleSheetConnection, 'id' | 'created_at' | 'updated_at'>) => Promise<GoogleSheetConnection>;
  disconnectSheet: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoMode } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sheetConnection, setSheetConnection] = useState<GoogleSheetConnection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Default date filter: Current Month (e.g. 2026-10-01 to 2026-10-31)
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>(() => {
    const now = new Date();
    return {
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    };
  });

  const resetToCurrentMonth = () => {
    const now = new Date();
    setDateRange({
      startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
    });
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [
        cats,
        txs,
        bgs,
        goals,
        recurring,
        subs,
        notifs,
        conn
      ] = await Promise.all([
        supabaseApi.getCategories(user.id),
        supabaseApi.getTransactions(user.id, isDemoMode),
        supabaseApi.getBudgets(user.id, isDemoMode),
        supabaseApi.getSavingsGoals(user.id, isDemoMode),
        supabaseApi.getRecurringExpenses(user.id, isDemoMode),
        supabaseApi.getSubscriptions(user.id, isDemoMode),
        supabaseApi.getNotifications(user.id, isDemoMode),
        supabaseApi.getSheetConnection(user.id, isDemoMode)
      ]);

      setCategories(cats);
      setTransactions(txs);
      setBudgets(bgs);
      setSavingsGoals(goals);
      setRecurringExpenses(recurring);
      setSubscriptions(subs);
      setNotifications(notifs);
      setSheetConnection(conn);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered transactions for current active date interval
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByDate(transactions, dateRange.startDate, dateRange.endDate);
  }, [transactions, dateRange]);

  // Previous period transactions (same duration prior) for MoM comparisons
  const previousPeriodTransactions = useMemo(() => {
    const start = new Date(dateRange.startDate);
    const prevStart = subMonths(start, 1);
    const prevEnd = endOfMonth(prevStart);
    return filterTransactionsByDate(
      transactions, 
      format(prevStart, 'yyyy-MM-dd'), 
      format(prevEnd, 'yyyy-MM-dd')
    );
  }, [transactions, dateRange]);

  // Budgets enhanced with real-time spending calculations
  const enhancedBudgets = useMemo(() => {
    return budgets.map(b => {
      // If category specific, compute spend in that category
      const relevantTxs = b.category_id 
        ? filteredTransactions.filter(t => t.type === 'expense' && t.category_id === b.category_id)
        : filteredTransactions.filter(t => t.type === 'expense');

      const spent = relevantTxs.reduce((acc, t) => acc + Number(t.amount), 0);
      const remaining = Math.max(0, b.amount - spent);
      const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

      return {
        ...b,
        spent,
        remaining,
        percentage
      };
    });
  }, [budgets, filteredTransactions]);

  // Financial summary
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(filteredTransactions, previousPeriodTransactions, enhancedBudgets);
  }, [filteredTransactions, previousPeriodTransactions, enhancedBudgets]);

  // Category spending breakdown
  const categorySpending = useMemo(() => {
    return calculateCategorySpending(filteredTransactions, 'expense');
  }, [filteredTransactions]);

  const incomeCategoryBreakdown = useMemo(() => {
    return calculateCategorySpending(filteredTransactions, 'income');
  }, [filteredTransactions]);

  // Daily trend
  const dailySpending = useMemo(() => {
    return calculateDailySpending(filteredTransactions);
  }, [filteredTransactions]);

  // Recurring & Subscriptions summary
  const recurringSummary = useMemo(() => {
    return calculateRecurringCommitment(recurringExpenses, subscriptions);
  }, [recurringExpenses, subscriptions]);

  // Spending Health Score
  const spendingHealth = useMemo(() => {
    return calculateSpendingHealthScore(financialSummary, recurringSummary.monthlyTotal, filteredTransactions.length);
  }, [financialSummary, recurringSummary, filteredTransactions.length]);

  // Factual Deterministic Insights
  const expenseInsights = useMemo(() => {
    return generateExpenseInsights(filteredTransactions, previousPeriodTransactions, enhancedBudgets, financialSummary.totalIncome);
  }, [filteredTransactions, previousPeriodTransactions, enhancedBudgets, financialSummary.totalIncome]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.read_at).length;
  }, [notifications]);

  // CRUD Actions
  const createTransaction = async (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await supabaseApi.createTransaction(tx, isDemoMode);
    setTransactions(prev => [created, ...prev]);

    // Check if category budget is now exceeded or warning
    if (created.type === 'expense' && created.category_id) {
      const b = budgets.find(b => b.category_id === created.category_id);
      if (b) {
        const catSpent = filteredTransactions
          .filter(t => t.type === 'expense' && t.category_id === b.category_id)
          .reduce((sum, t) => sum + Number(t.amount), 0) + Number(created.amount);

        const pct = Math.round((catSpent / b.amount) * 100);
        if (pct >= 100) {
          const notif: NotificationItem = {
            id: `notif-${Date.now()}`,
            user_id: user?.id || 'demo',
            type: 'budget_exceeded',
            title: `Budget Exceeded: ${b.name}`,
            message: `Spending reached ₹${catSpent.toLocaleString('en-IN')} (${pct}% of ₹${b.amount.toLocaleString('en-IN')}).`,
            read_at: null,
            link: '/budgets',
            created_at: new Date().toISOString()
          };
          setNotifications(prev => [notif, ...prev]);
        } else if (pct >= (b.alert_threshold || 80)) {
          const notif: NotificationItem = {
            id: `notif-${Date.now()}`,
            user_id: user?.id || 'demo',
            type: 'budget_warning',
            title: `Budget Warning: ${b.name}`,
            message: `You have utilized ${pct}% of your ${b.name} budget.`,
            read_at: null,
            link: '/budgets',
            created_at: new Date().toISOString()
          };
          setNotifications(prev => [notif, ...prev]);
        }
      }
    }

    return created;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updated = await supabaseApi.updateTransaction(id, updates, isDemoMode);
    setTransactions(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTransaction = async (id: string) => {
    await supabaseApi.deleteTransaction(id, isDemoMode);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const bulkDeleteTransactions = async (ids: string[]) => {
    await supabaseApi.bulkDeleteTransactions(ids, isDemoMode);
    setTransactions(prev => prev.filter(t => !ids.includes(t.id)));
  };

  const createCategory = async (cat: Omit<Category, 'id'>) => {
    const created = await supabaseApi.createCategory(cat, isDemoMode);
    setCategories(prev => [...prev, created]);
    return created;
  };

  const createBudget = async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await supabaseApi.createBudget(budget, isDemoMode);
    setBudgets(prev => [...prev, created]);
    return created;
  };

  const updateBudget = async (id: string, updates: Partial<Budget>) => {
    const updated = await supabaseApi.updateBudget(id, updates, isDemoMode);
    setBudgets(prev => prev.map(b => b.id === id ? updated : b));
    return updated;
  };

  const deleteBudget = async (id: string) => {
    await supabaseApi.deleteBudget(id, isDemoMode);
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const createGoal = async (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await supabaseApi.createGoal(goal, isDemoMode);
    setSavingsGoals(prev => [created, ...prev]);
    return created;
  };

  const updateGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    const updated = await supabaseApi.updateGoal(id, updates, isDemoMode);
    setSavingsGoals(prev => prev.map(g => g.id === id ? updated : g));
    return updated;
  };

  const deleteGoal = async (id: string) => {
    await supabaseApi.deleteGoal(id, isDemoMode);
    setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const goal = savingsGoals.find(g => g.id === id);
    if (!goal) return;
    const nextAmount = Math.max(0, goal.current_amount + amount);
    const nextStatus = nextAmount >= goal.target_amount ? 'completed' : goal.status;
    const updated = await supabaseApi.updateGoal(id, { current_amount: nextAmount, status: nextStatus }, isDemoMode);
    setSavingsGoals(prev => prev.map(g => g.id === id ? updated : g));

    if (nextStatus === 'completed' && goal.status !== 'completed') {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        user_id: user?.id || 'demo',
        type: 'goal_milestone',
        title: `Goal Achieved: ${goal.name}!`,
        message: `Congratulations! You have reached your ₹${goal.target_amount.toLocaleString('en-IN')} target.`,
        read_at: null,
        link: '/goals',
        created_at: new Date().toISOString()
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const createRecurring = async (item: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await supabaseApi.createRecurring(item, isDemoMode);
    setRecurringExpenses(prev => [...prev, created]);
    return created;
  };

  const deleteRecurring = async (id: string) => {
    await supabaseApi.deleteRecurring(id, isDemoMode);
    setRecurringExpenses(prev => prev.filter(r => r.id !== id));
  };

  const createSubscription = async (sub: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>) => {
    const created = await supabaseApi.createSubscription(sub, isDemoMode);
    setSubscriptions(prev => [...prev, created]);
    return created;
  };

  const deleteSubscription = async (id: string) => {
    await supabaseApi.deleteSubscription(id, isDemoMode);
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const markNotificationRead = async (id: string) => {
    await supabaseApi.markNotificationRead(id, isDemoMode);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllNotificationsRead = async () => {
    await supabaseApi.markAllNotificationsRead(user?.id, isDemoMode);
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const saveSheetConnection = async (conn: Omit<GoogleSheetConnection, 'id' | 'created_at' | 'updated_at'>) => {
    const saved = await supabaseApi.saveSheetConnection(conn, isDemoMode);
    setSheetConnection(saved);
    return saved;
  };

  const disconnectSheet = async () => {
    if (user?.id) {
      await supabaseApi.disconnectSheet(user.id, isDemoMode);
    }
    setSheetConnection(null);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        budgets: enhancedBudgets,
        savingsGoals,
        recurringExpenses,
        subscriptions,
        notifications,
        sheetConnection,
        isLoading,
        dateRange,
        setDateRange,
        resetToCurrentMonth,
        filteredTransactions,
        financialSummary,
        categorySpending,
        incomeCategoryBreakdown,
        dailySpending,
        spendingHealth,
        expenseInsights,
        recurringSummary,
        unreadNotificationCount,
        refreshAll: loadData,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        bulkDeleteTransactions,
        createCategory,
        createBudget,
        updateBudget,
        deleteBudget,
        createGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        createRecurring,
        deleteRecurring,
        createSubscription,
        deleteSubscription,
        markNotificationRead,
        markAllNotificationsRead,
        saveSheetConnection,
        disconnectSheet,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
