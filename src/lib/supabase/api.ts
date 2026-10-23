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

// State container for Demo mode session (in-memory for demo session)
let demoCategories: Category[] = [...INITIAL_CATEGORIES];
let demoTransactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let demoBudgets: Budget[] = [...INITIAL_BUDGETS];
let demoGoals: SavingsGoal[] = [...INITIAL_SAVINGS_GOALS];
let demoRecurring: RecurringExpense[] = [...INITIAL_RECURRING];
let demoSubscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS];
let demoNotifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
let demoSheetConnection: GoogleSheetConnection | null = null;

function getLocalToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('paisawise_jwt_token') : null;
}

function getLocalHeaders(): Record<string, string> {
  const token = getLocalToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const supabaseApi = {
  // ---------------------------------------------------------------------------
  // AUTH & PROFILES
  // ---------------------------------------------------------------------------
  async getProfile(userId: string): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
      const token = getLocalToken();
      if (token) {
        try {
          const res = await fetch('/api/auth/me', { headers: getLocalHeaders() });
          if (res.ok) {
            const data = await res.json();
            return data.profile;
          }
        } catch {
          // Fallback to local default
        }
      }
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
    if (!isSupabaseConfigured) {
      const token = getLocalToken();
      if (token) {
        try {
          const res = await fetch('/api/categories', { headers: getLocalHeaders() });
          if (res.ok) {
            return await res.json();
          }
        } catch {
          // Fallback to demo
        }
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify(category)
        });
        if (res.ok) return await res.json();
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/transactions', { headers: getLocalHeaders() });
          if (res.ok) return await res.json();
        } catch {
          // Fallback to demo
        }
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify(transaction)
        });
        if (res.ok) return await res.json();
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch(`/api/transactions/${id}`, {
          method: 'PUT',
          headers: getLocalHeaders(),
          body: JSON.stringify(updates)
        });
        if (res.ok) return await res.json();
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/transactions/${id}`, {
          method: 'DELETE',
          headers: getLocalHeaders()
        });
        return;
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch('/api/transactions/bulk-delete', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify({ ids })
        });
        return;
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/budgets', { headers: getLocalHeaders() });
          if (res.ok) return await res.json();
        } catch {
          // Fallback to demo
        }
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/budgets', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify(budget)
        });
        if (res.ok) return await res.json();
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch(`/api/budgets/${id}`, {
          method: 'PUT',
          headers: getLocalHeaders(),
          body: JSON.stringify(updates)
        });
        if (res.ok) return await res.json();
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/budgets/${id}`, { method: 'DELETE', headers: getLocalHeaders() });
        return;
      }
      demoBudgets = demoBudgets.filter(b => b.id !== id);
      return;
    }
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // SAVINGS GOALS
  // ---------------------------------------------------------------------------
  async getSavingsGoals(userId?: string, isDemo: boolean = false): Promise<SavingsGoal[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/goals', { headers: getLocalHeaders() });
          if (res.ok) return await res.json();
        } catch {
          // Fallback to demo
        }
      }
      return demoGoals;
    }
    const { data, error } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .order('target_date');

    if (error) throw error;
    return data || [];
  },

  async createSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<SavingsGoal> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/goals', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify(goal)
        });
        if (res.ok) return await res.json();
      }
      const newGoal: SavingsGoal = {
        ...goal,
        id: `goal-${Date.now()}`,
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

  async updateSavingsGoal(id: string, updates: Partial<SavingsGoal>, isDemo: boolean = false): Promise<SavingsGoal> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch(`/api/goals/${id}`, {
          method: 'PUT',
          headers: getLocalHeaders(),
          body: JSON.stringify(updates)
        });
        if (res.ok) return await res.json();
      }
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

  async contributeToGoal(id: string, amount: number, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/goals/${id}/contribute`, {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify({ amount })
        });
        return;
      }
      const idx = demoGoals.findIndex(g => g.id === id);
      if (idx !== -1) {
        const newCurrent = Number(demoGoals[idx].current_amount) + amount;
        demoGoals[idx].current_amount = newCurrent;
        if (newCurrent >= demoGoals[idx].target_amount) {
          demoGoals[idx].status = 'completed';
        }
      }
      return;
    }
    const { data: current } = await supabase
      .from('savings_goals')
      .select('current_amount, target_amount')
      .eq('id', id)
      .single();

    if (current) {
      const newAmount = Number(current.current_amount) + amount;
      const status = newAmount >= Number(current.target_amount) ? 'completed' : 'in_progress';
      await supabase
        .from('savings_goals')
        .update({ current_amount: newAmount, status })
        .eq('id', id);
    }
  },

  async deleteSavingsGoal(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: getLocalHeaders() });
        return;
      }
      demoGoals = demoGoals.filter(g => g.id !== id);
      return;
    }
    const { error } = await supabase
      .from('savings_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createGoal(goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<SavingsGoal> {
    return this.createSavingsGoal(goal, isDemo);
  },

  async updateGoal(id: string, updates: Partial<SavingsGoal>, isDemo: boolean = false): Promise<SavingsGoal> {
    return this.updateSavingsGoal(id, updates, isDemo);
  },

  async deleteGoal(id: string, isDemo: boolean = false): Promise<void> {
    return this.deleteSavingsGoal(id, isDemo);
  },

  // ---------------------------------------------------------------------------
  // RECURRING EXPENSES & SUBSCRIPTIONS
  // ---------------------------------------------------------------------------
  async getRecurringExpenses(userId?: string, isDemo: boolean = false): Promise<RecurringExpense[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/recurring', { headers: getLocalHeaders() });
          if (res.ok) {
            const data = await res.json();
            return data.recurring || [];
          }
        } catch {
          // Fallback to demo
        }
      }
      return demoRecurring;
    }
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('next_due_date');

    if (error) throw error;
    return data || [];
  },

  async createRecurringExpense(item: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<RecurringExpense> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/recurring', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify(item)
        });
        if (res.ok) return await res.json();
      }
      const cat = demoCategories.find(c => c.id === item.category_id);
      const newItem: RecurringExpense = {
        ...item,
        id: `rec-${Date.now()}`,
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

  async deleteRecurringExpense(id: string, isDemo: boolean = false): Promise<void> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/recurring/${id}`, { method: 'DELETE', headers: getLocalHeaders() });
        return;
      }
      demoRecurring = demoRecurring.filter(r => r.id !== id);
      return;
    }
    const { error } = await supabase
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async createRecurring(item: Omit<RecurringExpense, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<RecurringExpense> {
    return this.createRecurringExpense(item, isDemo);
  },

  async deleteRecurring(id: string, isDemo: boolean = false): Promise<void> {
    return this.deleteRecurringExpense(id, isDemo);
  },

  async getSubscriptions(userId?: string, isDemo: boolean = false): Promise<Subscription[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/recurring', { headers: getLocalHeaders() });
          if (res.ok) {
            const data = await res.json();
            return data.subscriptions || [];
          }
        } catch {
          // Fallback to demo
        }
      }
      return demoSubscriptions;
    }
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*, category:categories(*)')
      .eq('user_id', userId)
      .order('next_billing_date');

    if (error) throw error;
    return data || [];
  },

  async createSubscription(sub: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>, isDemo: boolean = false): Promise<Subscription> {
    if (!isSupabaseConfigured || isDemo) {
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/recurring', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify({ ...sub, is_subscription: true })
        });
        if (res.ok) return await res.json();
      }
      const cat = demoCategories.find(c => c.id === sub.category_id);
      const newSub: Subscription = {
        ...sub,
        id: `sub-${Date.now()}`,
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/recurring/${id}`, { method: 'DELETE', headers: getLocalHeaders() });
        return;
      }
      demoSubscriptions = demoSubscriptions.filter(s => s.id !== id);
      return;
    }
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------------------------
  async getNotifications(userId?: string, isDemo: boolean = false): Promise<NotificationItem[]> {
    if (!isSupabaseConfigured || isDemo || !userId) {
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/notifications', { headers: getLocalHeaders() });
          if (res.ok) return await res.json();
        } catch {
          // Fallback to demo
        }
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch(`/api/notifications/${id}/read`, { method: 'POST', headers: getLocalHeaders() });
        return;
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch('/api/notifications/read-all', { method: 'POST', headers: getLocalHeaders() });
        return;
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        try {
          const res = await fetch('/api/sheets-connection', { headers: getLocalHeaders() });
          if (res.ok) return await res.json();
        } catch {
          // Fallback to demo
        }
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        const res = await fetch('/api/sheets-connection', {
          method: 'POST',
          headers: getLocalHeaders(),
          body: JSON.stringify(conn)
        });
        if (res.ok) return await res.json();
      }
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
      const token = getLocalToken();
      if (!isDemo && token) {
        await fetch('/api/sheets-connection', { method: 'DELETE', headers: getLocalHeaders() });
        return;
      }
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
