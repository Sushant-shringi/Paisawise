import { describe, it, expect } from 'vitest';
import {
  roundMoney,
  calculateFinancialSummary,
  calculateCategorySpending,
  calculateRecurringCommitment,
  calculateSuggestedGoalContribution,
  generateExpenseInsights,
  calculateSpendingHealthScore,
  simulateSavings
} from '../financeCalculations';
import { formatCurrency, formatCompactCurrency, parseCurrencyInput } from '../currency';
import { Transaction, Budget, SavingsGoal, RecurringExpense, Subscription } from '@/types';

describe('Currency and Indian Number Formatting', () => {
  it('formats standard INR amounts with Lakhs and Crores properly', () => {
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(500)).toBe('₹500');
    expect(formatCurrency(12500)).toBe('₹12,500');
    expect(formatCurrency(150000)).toBe('₹1,50,000');
    expect(formatCurrency(2500000)).toBe('₹25,00,000');
    expect(formatCurrency(10000000)).toBe('₹1,00,00,000');
  });

  it('handles negative values and decimals correctly', () => {
    expect(formatCurrency(-4500)).toBe('-₹4,500');
    expect(formatCurrency(1450.75, { showDecimals: true })).toBe('₹1,450.75');
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(undefined)).toBe('₹0');
  });

  it('compacts large Indian numbers for cards and charts', () => {
    expect(formatCompactCurrency(450)).toBe('₹450');
    expect(formatCompactCurrency(25000)).toBe('₹25.0k');
    expect(formatCompactCurrency(250000)).toBe('₹2.5L');
    expect(formatCompactCurrency(15000000)).toBe('₹1.5Cr');
  });

  it('safely parses user input into numbers', () => {
    expect(parseCurrencyInput('₹1,50,000')).toBe(150000);
    expect(parseCurrencyInput('  450.50 ')).toBe(450.5);
    expect(parseCurrencyInput('')).toBe(0);
    expect(parseCurrencyInput('abc')).toBe(0);
  });
});

describe('Financial Calculation Core Engine', () => {
  it('eliminates floating point inaccuracies with roundMoney', () => {
    expect(0.1 + 0.2).not.toBe(0.3); // Javascript standard float glitch
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      user_id: 'user1',
      type: 'income',
      amount: 75000,
      currency: 'INR',
      title: 'Monthly Salary',
      transaction_date: '2026-10-01',
      payment_method: 'Net Banking',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z'
    },
    {
      id: '2',
      user_id: 'user1',
      type: 'income',
      amount: 15000,
      currency: 'INR',
      title: 'Freelance Design',
      transaction_date: '2026-10-15',
      payment_method: 'UPI',
      created_at: '2026-10-15T10:00:00Z',
      updated_at: '2026-10-15T10:00:00Z'
    },
    {
      id: '3',
      user_id: 'user1',
      category_id: 'cat-food',
      type: 'expense',
      amount: 6500,
      currency: 'INR',
      title: 'Restaurant & Groceries',
      transaction_date: '2026-10-05',
      payment_method: 'UPI',
      created_at: '2026-10-05T10:00:00Z',
      updated_at: '2026-10-05T10:00:00Z',
      category: { id: 'cat-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#f97316' }
    },
    {
      id: '4',
      user_id: 'user1',
      category_id: 'cat-rent',
      type: 'expense',
      amount: 25000,
      currency: 'INR',
      title: 'Apartment Rent',
      transaction_date: '2026-10-02',
      payment_method: 'Net Banking',
      created_at: '2026-10-02T10:00:00Z',
      updated_at: '2026-10-02T10:00:00Z',
      category: { id: 'cat-rent', name: 'Rent', type: 'expense', icon: 'Home', color: '#6366f1' }
    }
  ];

  const mockBudgets: Budget[] = [
    {
      id: 'b1',
      user_id: 'user1',
      name: 'Monthly Total Budget',
      amount: 45000,
      period: 'monthly',
      start_date: '2026-10-01',
      end_date: '2026-10-31',
      alert_threshold: 80,
      created_at: '',
      updated_at: ''
    }
  ];

  it('accurately calculates income, expenses, and net cashflow', () => {
    const summary = calculateFinancialSummary(mockTransactions, [], mockBudgets);
    expect(summary.totalIncome).toBe(90000);
    expect(summary.totalExpenses).toBe(31500);
    expect(summary.netCashFlow).toBe(58500);
    expect(summary.savingsRate).toBe(65); // 58500 / 90000 = 65%
    expect(summary.totalBudget).toBe(45000);
    expect(summary.budgetSpent).toBe(31500);
    expect(summary.budgetRemaining).toBe(13500);
    expect(summary.budgetUtilizationPct).toBe(70); // 31500 / 45000 = 70%
  });

  it('handles empty datasets gracefully without NaN or errors', () => {
    const summary = calculateFinancialSummary([], [], []);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.netCashFlow).toBe(0);
    expect(summary.savingsRate).toBe(0);
    expect(summary.budgetUtilizationPct).toBe(0);
  });

  it('accurately calculates category spending breakdowns', () => {
    const categoryBreakdown = calculateCategorySpending(mockTransactions, 'expense');
    expect(categoryBreakdown.length).toBe(2);
    // Highest category first
    expect(categoryBreakdown[0].categoryName).toBe('Rent');
    expect(categoryBreakdown[0].amount).toBe(25000);
    expect(categoryBreakdown[0].percentage).toBe(79.37);

    expect(categoryBreakdown[1].categoryName).toBe('Food & Dining');
    expect(categoryBreakdown[1].amount).toBe(6500);
    expect(categoryBreakdown[1].percentage).toBe(20.63);
  });

  it('computes recurring commitments across frequencies', () => {
    const recurring: RecurringExpense[] = [
      { id: '1', user_id: 'u1', title: 'Wifi', amount: 999, frequency: 'monthly', next_due_date: '2026-11-01', reminder_enabled: true, active: true, created_at: '', updated_at: '' },
      { id: '2', user_id: 'u1', title: 'Annual Insurance', amount: 12000, frequency: 'yearly', next_due_date: '2027-01-01', reminder_enabled: true, active: true, created_at: '', updated_at: '' },
      { id: '3', user_id: 'u1', title: 'Inactive Gym', amount: 2000, frequency: 'monthly', next_due_date: '2026-11-01', reminder_enabled: true, active: false, created_at: '', updated_at: '' }
    ];
    const subs: Subscription[] = [
      { id: 's1', user_id: 'u1', name: 'Netflix', amount: 649, billing_cycle: 'monthly', next_billing_date: '2026-11-15', reminder_enabled: true, active: true, created_at: '', updated_at: '' }
    ];

    const result = calculateRecurringCommitment(recurring, subs);
    // Wifi 999 + Annual Ins (12000/12=1000) + Netflix 649 = 2648
    expect(result.monthlyTotal).toBe(2648);
    expect(result.yearlyTotal).toBe(31776);
    expect(result.activeCount).toBe(3);
  });

  it('determines savings goal milestones and monthly suggestions', () => {
    const goal: SavingsGoal = {
      id: 'g1',
      user_id: 'u1',
      name: 'Emergency Fund',
      target_amount: 150000,
      current_amount: 50000,
      // Target 10 months in the future from 2026-10-24
      target_date: '2027-08-24',
      status: 'in_progress',
      created_at: '',
      updated_at: ''
    };

    const res = calculateSuggestedGoalContribution(goal);
    expect(res.remainingAmount).toBe(100000);
    expect(res.monthsRemaining).toBeGreaterThan(0);
    expect(res.suggestedMonthly).toBeGreaterThan(0);
  });

  it('computes deterministic insights accurately', () => {
    const insights = generateExpenseInsights(mockTransactions, [], mockBudgets, 90000);
    expect(insights.length).toBeGreaterThan(0);
    const topInsight = insights.find(i => i.id === 'top-spending-cat');
    expect(topInsight).toBeDefined();
    expect(topInsight?.title).toContain('Rent');
  });

  it('evaluates spending health score transparently', () => {
    const summary = calculateFinancialSummary(mockTransactions, [], mockBudgets);
    const health = calculateSpendingHealthScore(summary, 2648, mockTransactions.length);
    expect(health.score).toBeGreaterThan(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(['Excellent', 'Good', 'Fair', 'Needs Attention']).toContain(health.grade);
    expect(health.breakdown.budgetAdherence.score).toBeDefined();
  });

  it('simulates what-if scenarios deterministically', () => {
    const sim = simulateSavings('Dining Out', 2000, 6, 7.0);
    expect(sim.totalSaved).toBe(12000); // 2000 * 6
    expect(sim.potentialAnnualCompound).toBeGreaterThan(12000);
  });
});
