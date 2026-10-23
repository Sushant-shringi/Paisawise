import { supabase, isSupabaseConfigured } from './client';
import { 
  Transaction, 
  Category, 
  Budget, 
  SavingsGoal, 
  RecurringExpense, 
  Subscription, 
  NotificationItem, 
  GoogleSheetConnection,
  Profile 
} from '@/types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_BUDGETS, 
  INITIAL_SAVINGS_GOALS, 
  INITIAL_RECURRING, 
  INITIAL_SUBSCRIPTIONS, 
  INITIAL_NOTIFICATIONS 
} from '@/lib/mockData';

// State container for Demo mode session (in-memory for session)
let demoCategories: Category[] = [...INITIAL_CATEGORIES];
let demoTransactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let demoBudgets: Budget[] = [...INITIAL_BUDGETS];
let demoGoals: SavingsGoal[] = [...INITIAL_SAVINGS_GOALS];
let demoRecurring: RecurringExpense[] = [...INITIAL_RECURRING];
let demoSubscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS];
let demoNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let demoSheetConnection: GoogleSheetConnection | null = null;

export const supabaseApi = {
  // ---------------------------------------------------------------------------
  // AUTH & PROFILES
  // ---------------------------------------------------------------------------
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
      return {
        id: userId,
        full_name: 'Aditya Sharma',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        monthly_income_target: 120000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<boolean> {
    if (!isSupabaseConfigured) return true;
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
    return true;
  },

  // ---------------------------------------------------------------------------
  // CATEGORIES
  // ---------------------------------------------------------------------------
  async getCategories(userId?: string): Promise<Category[]> {
    if (!isSupabaseConfigured || !userId) {
      return demoCategories;
    }
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name');

    if (error) {
      console.error('Error fetching categories from Supabase:', error);
      return demoCategories;
    }
    return data && data.length > 0 ? data : demoCategories;
  },

  async createCategory(category: Omit<Category, 'id'>, isDemo: boolean = false): Promise<Category> {
    if (!isSupabaseConfigured || isDemo) {
      const newCat: Category = {
        ...category,
        id: `cat-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      demoCategories = [newCat, ...demoCategories];
      return newCat;
    }
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ---------------------------------------------------------------------------
  // TRANSACTIONS
  // ---------------------------------------------------------------------------
  async getTransactions(userId?: string, isDemo: boolean = false): Promise<Transaction[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return [...demoTransactions].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions from Supabase:', error);
      throw error;
    }
    return data || [];
  },

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<Transaction> {
    if (!isSupabaseConfigured || isDemo) {
      const cat = demoCategories.find(c => c.id === transaction.category_id);
      const newTx: Transaction = {
        ...transaction,
        id: `tx-${Date.now()}`,
        category: cat,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoTransactions = [newTx, ...demoTransactions];
      return newTx;
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: transaction.user_id,
        account_id: transaction.account_id || null,
        category_id: transaction.category_id || null,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency || 'INR',
        title: transaction.title,
        description: transaction.description || null,
        transaction_date: transaction.transaction_date,
        payment_method: transaction.payment_method,
        notes: transaction.notes || null
      })
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>, isDemo: boolean = false): Promise<Transaction> {
    if (!isSupabaseConfigured || isDemo) {
      const idx = demoTransactions.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Transaction not found');
      const cat = updates.category_id ? demoCategories.find(c => c.id === updates.category_id) : demoTransactions[idx].category;
      demoTransactions[idx] = {
        ...demoTransactions[idx],
        ...updates,
        category: cat,
        updated_at: new Date().toISOString()
      };
      return demoTransactions[idx];
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoTransactions = demoTransactions.filter(t => t.id !== id);
      return;
    }
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkDeleteTransactions(ids: string[], isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoTransactions = demoTransactions.filter(t => !ids.includes(t.id));
      return;
    }
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', ids);

    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // BUDGETS
  // ---------------------------------------------------------------------------
  async getBudgets(userId?: string, isDemo: boolean = false): Promise<Budget[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return demoBudgets;
    }
    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<Budget> {
    if (!isSupabaseConfigured || isDemo) {
      const cat = demoCategories.find(c => c.id === budget.category_id);
      const newBudget: Budget = {
        ...budget,
        id: `b-${Date.now()}`,
        category: cat,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoBudgets = [newBudget, ...demoBudgets];
      return newBudget;
    }

    const { data, error } = await supabase
      .from('budgets')
      .insert(budget)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async updateBudget(id: string, updates: Partial<Budget>, isDemo: boolean = false): Promise<Budget> {
    if (!isSupabaseConfigured || isDemo) {
      const idx = demoBudgets.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Budget not found');
      demoBudgets[idx] = { ...demoBudgets[idx], ...updates, updated_at: new Date().toISOString() };
      return demoBudgets[idx];
    }
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBudget(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoBudgets = demoBudgets.filter(b => b.id !== id);
      return;
    }
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // SAVINGS GOALS
  // ---------------------------------------------------------------------------
  async getSavingsGoals(userId?: string, isDemo: boolean = false): Promise<SavingsGoal[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return demoGoals;
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<SavingsGoal> {
    if (!isSupabaseConfigured || isDemo) {
      const newGoal: SavingsGoal = {
        ...goal,
        id: `g-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoGoals = [newGoal, ...demoGoals];
      return newGoal;
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .insert(goal)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGoal(id: string, updates: Partial<SavingsGoal>, isDemo: boolean = false): Promise<SavingsGoal> {
    if (!isSupabaseConfigured || isDemo) {
      const idx = demoGoals.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Goal not found');
      demoGoals[idx] = { ...demoGoals[idx], ...updates, updated_at: new Date().toISOString() };
      return demoGoals[idx];
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGoal(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoGoals = demoGoals.filter(g => g.id !== id);
      return;
    }
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // RECURRING EXPENSES & SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  async getRecurringExpenses(userId?: string, isDemo: boolean = false): Promise<RecurringExpense[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return demoRecurring;
    }
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*, category:categories(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async createRecurring(item: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<RecurringExpense> {
    if (!isSupabaseConfigured || isDemo) {
      const cat = demoCategories.find(c => c.id === item.category_id);
      const newItem: RecurringExpense = {
        ...item,
        id: `r-${Date.now()}`,
        category: cat,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoRecurring = [newItem, ...demoRecurring];
      return newItem;
    }
    const { data, error } = await supabase
      .from('recurring_expenses')
      .insert(item)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRecurring(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoRecurring = demoRecurring.filter(r => r.id !== id);
      return;
    }
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id);
    if (error) throw error;
  },

  async getSubscriptions(userId?: string, isDemo: boolean = false): Promise<Subscription[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return demoSubscriptions;
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, category:categories(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async createSubscription(sub: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<Subscription> {
    if (!isSupabaseConfigured || isDemo) {
      const cat = demoCategories.find(c => c.id === sub.category_id);
      const newSub: Subscription = {
        ...sub,
        id: `s-${Date.now()}`,
        category: cat,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      demoSubscriptions = [newSub, ...demoSubscriptions];
      return newSub;
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(sub)
      .select('*, category:categories(*)')
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSubscription(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoSubscriptions = demoSubscriptions.filter(s => s.id !== id);
      return;
    }
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------
  async getNotifications(userId?: string, isDemo: boolean = false): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return demoNotifications;
    }
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markNotificationRead(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoNotifications = demoNotifications.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n);
      return;
    }
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  async markAllNotificationsRead(userId?: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      demoNotifications = demoNotifications.map(n => ({ ...n, read_at: new Date().toISOString() }));
      return;
    }
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // GOOGLE SHEETS CONNECTION
  // ---------------------------------------------------------------------------
  async getSheetConnection(userId?: string, isDemo: boolean = false): Promise<GoogleSheetConnection | null> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      return demoSheetConnection;
    }
    const { data, error } = await supabase
      .from('google_sheet_connections')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) return null;
    return data;
  },

  async saveSheetConnection(conn: Omit<GoogleSheetConnection, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<GoogleSheetConnection> {
    if (!isSupabaseConfigured || isDemo) {
      demoSheetConnection = {
        ...conn,
        id: `sheet-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return demoSheetConnection;
    }
    const { data, error } = await supabase
      .from('google_sheet_connections')
      .upsert(conn, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async disconnectSheet(userId: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      demoSheetConnection = null;
      return;
    }
    const { error } = await supabase
      .from('google_sheet_connections')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
};
