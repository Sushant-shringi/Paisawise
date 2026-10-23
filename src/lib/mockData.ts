import { Transaction, Category, Budget, SavingsGoal, RecurringExpense, Subscription, NotificationItem } from '@/types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f97316' },
  { id: 'cat-groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingBag', color: '#84cc16' },
  { id: 'cat-transport', name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#06b6d4' },
  { id: 'cat-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#8b5cf6' },
  { id: 'cat-bills', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#eab308' },
  { id: 'cat-healthcare', name: 'Healthcare & Meds', type: 'expense', icon: 'Activity', color: '#ef4444' },
  { id: 'cat-rent', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#6366f1' },
  { id: 'cat-subs', name: 'Subscriptions', type: 'expense', icon: 'CreditCard', color: '#a855f7' },
  { id: 'cat-travel', name: 'Travel & Vacation', type: 'expense', icon: 'Compass', color: '#14b8a6' },
  { id: 'cat-other-exp', name: 'Other Expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },
  
  // Income categories
  { id: 'cat-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { id: 'cat-freelance', name: 'Freelance & Consulting', type: 'income', icon: 'Laptop', color: '#059669' },
  { id: 'cat-investments', name: 'Investments & Dividends', type: 'income', icon: 'TrendingUp', color: '#3b82f6' },
  { id: 'cat-cashback', name: 'Cashback & Rewards', type: 'income', icon: 'Gift', color: '#ec4899' },
  { id: 'cat-other-inc', name: 'Other Income', type: 'income', icon: 'DollarSign', color: '#64748b' }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-001',
    user_id: 'demo-user',
    category_id: 'cat-salary',
    type: 'income',
    amount: 110000,
    currency: 'INR',
    title: 'Monthly Tech Salary',
    description: 'Direct corporate deposit for October',
    transaction_date: '2026-10-01',
    payment_method: 'Net Banking',
    created_at: '2026-10-01T09:30:00Z',
    updated_at: '2026-10-01T09:30:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-salary')
  },
  {
    id: 'tx-002',
    user_id: 'demo-user',
    category_id: 'cat-rent',
    type: 'expense',
    amount: 32000,
    currency: 'INR',
    title: 'Apartment Rent (2BHK Koramangala)',
    description: 'Paid to landlord via UPI',
    transaction_date: '2026-10-02',
    payment_method: 'UPI',
    created_at: '2026-10-02T11:00:00Z',
    updated_at: '2026-10-02T11:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-rent')
  },
  {
    id: 'tx-003',
    user_id: 'demo-user',
    category_id: 'cat-groceries',
    type: 'expense',
    amount: 5420,
    currency: 'INR',
    title: 'Nature Basket & Blinkit Restock',
    description: 'Weekly veggies, milk, fruits, and pantry essentials',
    transaction_date: '2026-10-04',
    payment_method: 'UPI',
    created_at: '2026-10-04T18:20:00Z',
    updated_at: '2026-10-04T18:20:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-groceries')
  },
  {
    id: 'tx-004',
    user_id: 'demo-user',
    category_id: 'cat-bills',
    type: 'expense',
    amount: 1850,
    currency: 'INR',
    title: 'Electricity & BESCOM Bill',
    description: 'October domestic power bill',
    transaction_date: '2026-10-06',
    payment_method: 'Net Banking',
    created_at: '2026-10-06T14:10:00Z',
    updated_at: '2026-10-06T14:10:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-bills')
  },
  {
    id: 'tx-005',
    user_id: 'demo-user',
    category_id: 'cat-food',
    type: 'expense',
    amount: 1450,
    currency: 'INR',
    title: 'Weekend Brunch with Friends',
    description: 'Third Wave Coffee roastery',
    transaction_date: '2026-10-10',
    payment_method: 'Credit Card',
    created_at: '2026-10-10T13:45:00Z',
    updated_at: '2026-10-10T13:45:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-food')
  },
  {
    id: 'tx-006',
    user_id: 'demo-user',
    category_id: 'cat-freelance',
    type: 'income',
    amount: 28000,
    currency: 'INR',
    title: 'Fintech UI Consultation',
    description: 'Deliverable sprint milestone payment',
    transaction_date: '2026-10-12',
    payment_method: 'Net Banking',
    created_at: '2026-10-12T16:00:00Z',
    updated_at: '2026-10-12T16:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-freelance')
  },
  {
    id: 'tx-007',
    user_id: 'demo-user',
    category_id: 'cat-transport',
    type: 'expense',
    amount: 3200,
    currency: 'INR',
    title: 'Petrol & Uber Rides',
    description: 'Shell fuel refill and airport cab',
    transaction_date: '2026-10-15',
    payment_method: 'Credit Card',
    created_at: '2026-10-15T19:10:00Z',
    updated_at: '2026-10-15T19:10:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-transport')
  },
  {
    id: 'tx-008',
    user_id: 'demo-user',
    category_id: 'cat-subs',
    type: 'expense',
    amount: 649,
    currency: 'INR',
    title: 'Netflix 4K Ultra Subscription',
    description: 'Autopay monthly debit',
    transaction_date: '2026-10-16',
    payment_method: 'Credit Card',
    created_at: '2026-10-16T08:00:00Z',
    updated_at: '2026-10-16T08:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-subs')
  },
  {
    id: 'tx-009',
    user_id: 'demo-user',
    category_id: 'cat-food',
    type: 'expense',
    amount: 480,
    currency: 'INR',
    title: 'Swiggy Dinner Order',
    description: 'Biryani bowl delivery',
    transaction_date: '2026-10-18',
    payment_method: 'UPI',
    created_at: '2026-10-18T21:15:00Z',
    updated_at: '2026-10-18T21:15:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-food')
  },
  {
    id: 'tx-010',
    user_id: 'demo-user',
    category_id: 'cat-shopping',
    type: 'expense',
    amount: 4500,
    currency: 'INR',
    title: 'Noise Cancelling Earbuds (Amazon)',
    description: 'Great Indian Festival sale purchase',
    transaction_date: '2026-10-20',
    payment_method: 'Credit Card',
    created_at: '2026-10-20T15:30:00Z',
    updated_at: '2026-10-20T15:30:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-shopping')
  },
  {
    id: 'tx-011',
    user_id: 'demo-user',
    category_id: 'cat-food',
    type: 'expense',
    amount: 150,
    currency: 'INR',
    title: 'Evening Chai & Samosa',
    description: 'Chai Point tap and pay',
    transaction_date: '2026-10-21',
    payment_method: 'UPI',
    created_at: '2026-10-21T17:40:00Z',
    updated_at: '2026-10-21T17:40:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-food')
  },
  {
    id: 'tx-012',
    user_id: 'demo-user',
    category_id: 'cat-healthcare',
    type: 'expense',
    amount: 1250,
    currency: 'INR',
    title: 'Apollo Pharmacy & Multivitamins',
    description: 'Monthly health check supplements',
    transaction_date: '2026-10-22',
    payment_method: 'UPI',
    created_at: '2026-10-22T12:00:00Z',
    updated_at: '2026-10-22T12:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-healthcare')
  }
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b-001',
    user_id: 'demo-user',
    category_id: 'cat-food',
    name: 'Food & Dining Limit',
    amount: 8000,
    period: 'monthly',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    alert_threshold: 80,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-food')
  },
  {
    id: 'b-002',
    user_id: 'demo-user',
    category_id: 'cat-groceries',
    name: 'Monthly Groceries Budget',
    amount: 10000,
    period: 'monthly',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    alert_threshold: 80,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-groceries')
  },
  {
    id: 'b-003',
    user_id: 'demo-user',
    category_id: 'cat-shopping',
    name: 'Discretionary Shopping',
    amount: 6000,
    period: 'monthly',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    alert_threshold: 75,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-shopping')
  },
  {
    id: 'b-004',
    user_id: 'demo-user',
    category_id: 'cat-transport',
    name: 'Commute & Travel',
    amount: 5000,
    period: 'monthly',
    start_date: '2026-10-01',
    end_date: '2026-10-31',
    alert_threshold: 80,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-transport')
  }
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'g-001',
    user_id: 'demo-user',
    name: 'Emergency Fund (6 Months Expenses)',
    target_amount: 300000,
    current_amount: 185000,
    target_date: '2027-06-30',
    description: 'Liquid FD buffer kept for unforeseen events or medical needs',
    status: 'in_progress',
    color: '#10b981',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  },
  {
    id: 'g-002',
    user_id: 'demo-user',
    name: 'MacBook Pro M-Series Upgrade',
    target_amount: 160000,
    current_amount: 110000,
    target_date: '2026-12-31',
    description: 'Workstation upgrade for high-performance software development',
    status: 'in_progress',
    color: '#6366f1',
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-10-15T00:00:00Z'
  },
  {
    id: 'g-003',
    user_id: 'demo-user',
    name: 'Goa Year-End Vacation',
    target_amount: 45000,
    current_amount: 35000,
    target_date: '2026-12-25',
    description: 'Flight tickets, beachside stay, and watersports with college batchmates',
    status: 'in_progress',
    color: '#f59e0b',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-10-20T00:00:00Z'
  }
];

export const INITIAL_RECURRING: RecurringExpense[] = [
  {
    id: 'r-001',
    user_id: 'demo-user',
    category_id: 'cat-rent',
    title: 'Apartment Monthly Rent',
    amount: 32000,
    frequency: 'monthly',
    next_due_date: '2026-11-01',
    reminder_enabled: true,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-rent')
  },
  {
    id: 'r-002',
    user_id: 'demo-user',
    category_id: 'cat-bills',
    title: 'Airtel Xstream Fiber Broadband',
    amount: 1180,
    frequency: 'monthly',
    next_due_date: '2026-11-05',
    reminder_enabled: true,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-bills')
  },
  {
    id: 'r-003',
    user_id: 'demo-user',
    category_id: 'cat-bills',
    title: 'HDFC Vehicle Insurance',
    amount: 8500,
    frequency: 'yearly',
    next_due_date: '2027-02-15',
    reminder_enabled: true,
    active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-bills')
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 's-001',
    user_id: 'demo-user',
    category_id: 'cat-subs',
    name: 'Netflix 4K Ultra',
    amount: 649,
    billing_cycle: 'monthly',
    next_billing_date: '2026-11-16',
    reminder_enabled: true,
    active: true,
    website_url: 'https://netflix.com',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-10-16T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-subs')
  },
  {
    id: 's-002',
    user_id: 'demo-user',
    category_id: 'cat-subs',
    name: 'Spotify Premium Duo',
    amount: 149,
    billing_cycle: 'monthly',
    next_billing_date: '2026-11-22',
    reminder_enabled: true,
    active: true,
    website_url: 'https://spotify.com',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-10-22T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-subs')
  },
  {
    id: 's-003',
    user_id: 'demo-user',
    category_id: 'cat-subs',
    name: 'Cult.fit Elite Gym Membership',
    amount: 14500,
    billing_cycle: 'yearly',
    next_billing_date: '2027-04-10',
    reminder_enabled: true,
    active: true,
    website_url: 'https://cult.fit',
    created_at: '2026-04-10T00:00:00Z',
    updated_at: '2026-04-10T00:00:00Z',
    category: INITIAL_CATEGORIES.find(c => c.id === 'cat-subs')
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-001',
    user_id: 'demo-user',
    type: 'budget_warning',
    title: 'Discretionary Shopping Alert',
    message: 'You have utilized 75% of your ₹6,000 monthly Shopping budget.',
    read_at: null,
    link: '/budgets',
    created_at: '2026-10-20T16:00:00Z'
  },
  {
    id: 'notif-002',
    user_id: 'demo-user',
    type: 'recurring_due',
    title: 'Upcoming Bill: Airtel Fiber',
    message: '₹1,180 broadband payment is due in 12 days on 5 Nov 2026.',
    read_at: null,
    link: '/recurring',
    created_at: '2026-10-23T08:00:00Z'
  },
  {
    id: 'notif-003',
    user_id: 'demo-user',
    type: 'goal_milestone',
    title: 'Emergency Fund 60% Milestone!',
    message: 'Congratulations! You have crossed ₹1,80,000 in your Emergency Fund savings.',
    read_at: '2026-10-15T10:00:00Z',
    link: '/goals',
    created_at: '2026-10-15T09:00:00Z'
  }
];
