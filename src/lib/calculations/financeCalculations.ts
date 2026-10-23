import { Transaction, Budget, SavingsGoal, RecurringExpense, Subscription, FinancialSummary, SpendingHealthScore } from '@/types';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, format } from 'date-fns';

/**
 * Monetary rounding helper to eliminate floating point imprecisions
 */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Filter transactions falling inside a specific date interval
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  startDate: Date | string,
  endDate: Date | string
): Transaction[] {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

  // Set boundary to whole day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return transactions.filter(t => {
    const tDate = parseISO(t.transaction_date);
    return isWithinInterval(tDate, { start, end });
  });
}

/**
 * Compute aggregate financial summary for a set of transactions and budgets
 */
export function calculateFinancialSummary(
  currentPeriodTransactions: Transaction[],
  previousPeriodTransactions: Transaction[] = [],
  budgets: Budget[] = []
): FinancialSummary {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of currentPeriodTransactions) {
    if (t.type === 'income') {
      totalIncome += Number(t.amount);
    } else if (t.type === 'expense') {
      totalExpenses += Number(t.amount);
    }
  }

  totalIncome = roundMoney(totalIncome);
  totalExpenses = roundMoney(totalExpenses);
  const netCashFlow = roundMoney(totalIncome - totalExpenses);

  // Savings rate = (Net Cash Flow / Total Income) * 100 if income > 0
  const savingsRate = totalIncome > 0 && netCashFlow > 0 
    ? Math.min(100, roundMoney((netCashFlow / totalIncome) * 100))
    : 0;

  // Previous period calculations
  let previousMonthIncome = 0;
  let previousMonthExpense = 0;

  for (const t of previousPeriodTransactions) {
    if (t.type === 'income') {
      previousMonthIncome += Number(t.amount);
    } else if (t.type === 'expense') {
      previousMonthExpense += Number(t.amount);
    }
  }

  previousMonthIncome = roundMoney(previousMonthIncome);
  previousMonthExpense = roundMoney(previousMonthExpense);

  const momIncomeChangePct = previousMonthIncome > 0 
    ? roundMoney(((totalIncome - previousMonthIncome) / previousMonthIncome) * 100)
    : 0;

  const momExpenseChangePct = previousMonthExpense > 0
    ? roundMoney(((totalExpenses - previousMonthExpense) / previousMonthExpense) * 100)
    : 0;

  // Budget calculations
  let totalBudget = 0;
  for (const b of budgets) {
    totalBudget += Number(b.amount);
  }
  totalBudget = roundMoney(totalBudget);

  const budgetSpent = totalExpenses;
  const budgetRemaining = roundMoney(Math.max(0, totalBudget - budgetSpent));
  const budgetUtilizationPct = totalBudget > 0 
    ? roundMoney((budgetSpent / totalBudget) * 100)
    : 0;

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    totalBudget,
    budgetSpent,
    budgetRemaining,
    budgetUtilizationPct,
    momIncomeChangePct,
    momExpenseChangePct,
    previousMonthExpense,
    previousMonthIncome
  };
}

/**
 * Calculate spending grouped by category with amounts, count, and percentage
 */
export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export function calculateCategorySpending(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense'
): CategorySpending[] {
  const filtered = transactions.filter(t => t.type === type);
  const total = filtered.reduce((acc, curr) => acc + Number(curr.amount), 0);

  const map = new Map<string, { name: string; color: string; icon: string; amount: number; count: number }>();

  for (const t of filtered) {
    const catId = t.category_id || 'uncategorized';
    const catName = t.category?.name || 'Uncategorized';
    const catColor = t.category?.color || '#94a3b8';
    const catIcon = t.category?.icon || 'Tag';

    const existing = map.get(catId) || { name: catName, color: catColor, icon: catIcon, amount: 0, count: 0 };
    existing.amount += Number(t.amount);
    existing.count += 1;
    map.set(catId, existing);
  }

  const result: CategorySpending[] = [];
  map.forEach((value, key) => {
    result.push({
      categoryId: key,
      categoryName: value.name,
      color: value.color,
      icon: value.icon,
      amount: roundMoney(value.amount),
      percentage: total > 0 ? roundMoney((value.amount / total) * 100) : 0,
      transactionCount: value.count
    });
  });

  // Sort descending by amount
  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Group transactions by day for Recharts line / bar charts
 */
export interface DailySpending {
  date: string;
  dayLabel: string;
  income: number;
  expense: number;
  net: number;
}

export function calculateDailySpending(transactions: Transaction[]): DailySpending[] {
  const dayMap = new Map<string, { income: number; expense: number }>();

  for (const t of transactions) {
    const dateKey = t.transaction_date;
    const existing = dayMap.get(dateKey) || { income: 0, expense: 0 };
    if (t.type === 'income') {
      existing.income += Number(t.amount);
    } else {
      existing.expense += Number(t.amount);
    }
    dayMap.set(dateKey, existing);
  }

  const sortedDates = Array.from(dayMap.keys()).sort();

  return sortedDates.map(dateKey => {
    const val = dayMap.get(dateKey)!;
    const dateObj = parseISO(dateKey);
    return {
      date: dateKey,
      dayLabel: format(dateObj, 'd MMM'),
      income: roundMoney(val.income),
      expense: roundMoney(val.expense),
      net: roundMoney(val.income - val.expense)
    };
  });
}

/**
 * Calculate monthly and annualized recurring bill commitments
 */
export function calculateRecurringCommitment(
  recurring: RecurringExpense[],
  subscriptions: Subscription[]
): { monthlyTotal: number; yearlyTotal: number; activeCount: number } {
  let monthlyTotal = 0;
  let activeCount = 0;

  for (const item of recurring) {
    if (!item.active) continue;
    activeCount++;
    const amt = Number(item.amount);
    switch (item.frequency) {
      case 'weekly':
        monthlyTotal += amt * 4.333;
        break;
      case 'monthly':
        monthlyTotal += amt;
        break;
      case 'quarterly':
        monthlyTotal += amt / 3;
        break;
      case 'yearly':
        monthlyTotal += amt / 12;
        break;
    }
  }

  for (const sub of subscriptions) {
    if (!sub.active) continue;
    activeCount++;
    const amt = Number(sub.amount);
    switch (sub.billing_cycle) {
      case 'monthly':
        monthlyTotal += amt;
        break;
      case 'quarterly':
        monthlyTotal += amt / 3;
        break;
      case 'yearly':
        monthlyTotal += amt / 12;
        break;
    }
  }

  monthlyTotal = roundMoney(monthlyTotal);
  return {
    monthlyTotal,
    yearlyTotal: roundMoney(monthlyTotal * 12),
    activeCount
  };
}

/**
 * Suggested monthly contribution to reach savings goal by target date
 */
export function calculateSuggestedGoalContribution(goal: SavingsGoal): {
  remainingAmount: number;
  monthsRemaining: number;
  suggestedMonthly: number;
  isOverdue: boolean;
} {
  const remainingAmount = Math.max(0, roundMoney(goal.target_amount - goal.current_amount));
  const target = parseISO(goal.target_date);
  const now = new Date();
  
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const monthsRemaining = Math.max(1, Math.ceil(diffDays / 30));
  const isOverdue = diffDays < 0;

  const suggestedMonthly = remainingAmount > 0 ? roundMoney(remainingAmount / monthsRemaining) : 0;

  return {
    remainingAmount,
    monthsRemaining,
    suggestedMonthly,
    isOverdue
  };
}

/**
 * Deterministic Expense Insights Engine
 * Produces explainable financial findings strictly grounded in user records
 */
export interface InsightResult {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  description: string;
  metrics?: { label: string; value: string }[];
}

export function generateExpenseInsights(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[] = [],
  budgets: Budget[] = [],
  monthlyIncome: number = 0
): InsightResult[] {
  const insights: InsightResult[] = [];
  const currentExpenses = currentTransactions.filter(t => t.type === 'expense');
  const prevExpenses = previousTransactions.filter(t => t.type === 'expense');

  if (currentExpenses.length === 0) {
    return [
      {
        id: 'no-expenses',
        type: 'info',
        title: 'No Expenses Recorded Yet',
        description: 'Start logging your daily transactions or import past records to uncover actionable spending insights.'
      }
    ];
  }

  // 1. Top spending category
  const categories = calculateCategorySpending(currentTransactions, 'expense');
  if (categories.length > 0) {
    const topCat = categories[0];
    insights.push({
      id: 'top-spending-cat',
      type: 'info',
      title: `Largest Expense: ${topCat.categoryName}`,
      description: `${topCat.categoryName} accounts for ${topCat.percentage}% of your spending this period with ${topCat.transactionCount} transactions.`,
      metrics: [
        { label: 'Amount', value: `₹${topCat.amount.toLocaleString('en-IN')}` },
        { label: 'Share', value: `${topCat.percentage}%` }
      ]
    });
  }

  // 2. Category with largest increase vs prior month
  if (prevExpenses.length > 0) {
    const prevCategories = calculateCategorySpending(previousTransactions, 'expense');
    const prevCatMap = new Map(prevCategories.map(c => [c.categoryId, c.amount]));

    let largestIncreaseCat: { name: string; diff: number; pct: number } | null = null;

    for (const c of categories) {
      const prevAmt = prevCatMap.get(c.categoryId) || 0;
      if (prevAmt > 0) {
        const diff = c.amount - prevAmt;
        if (diff > 0 && (!largestIncreaseCat || diff > largestIncreaseCat.diff)) {
          largestIncreaseCat = {
            name: c.categoryName,
            diff: roundMoney(diff),
            pct: roundMoney((diff / prevAmt) * 100)
          };
        }
      }
    }

    if (largestIncreaseCat) {
      insights.push({
        id: 'cat-surge',
        type: 'warning',
        title: `Spending Increase in ${largestIncreaseCat.name}`,
        description: `Spending on ${largestIncreaseCat.name} rose by ₹${largestIncreaseCat.diff.toLocaleString('en-IN')} (+${largestIncreaseCat.pct}%) compared to the prior period.`,
        metrics: [
          { label: 'Increase', value: `+₹${largestIncreaseCat.diff.toLocaleString('en-IN')}` },
          { label: 'Growth', value: `+${largestIncreaseCat.pct}%` }
        ]
      });
    }
  }

  // 3. Frequent small purchases analyzer (< ₹200)
  const smallPurchases = currentExpenses.filter(t => Number(t.amount) <= 200);
  if (smallPurchases.length >= 5) {
    const smallTotal = roundMoney(smallPurchases.reduce((acc, t) => acc + Number(t.amount), 0));
    insights.push({
      id: 'small-purchases',
      type: 'info',
      title: 'Micro-Spending Accumulation',
      description: `You logged ${smallPurchases.length} small purchases (under ₹200) totaling ₹${smallTotal.toLocaleString('en-IN')}. Daily tea, snacks, and minor orders accumulate fast!`,
      metrics: [
        { label: 'Small Orders', value: `${smallPurchases.length}` },
        { label: 'Total', value: `₹${smallTotal.toLocaleString('en-IN')}` }
      ]
    });
  }

  // 4. Weekend vs Weekday spending
  let weekendSpending = 0;
  let weekdaySpending = 0;

  for (const t of currentExpenses) {
    const day = parseISO(t.transaction_date).getDay();
    if (day === 0 || day === 6) {
      weekendSpending += Number(t.amount);
    } else {
      weekdaySpending += Number(t.amount);
    }
  }

  const totalExp = weekendSpending + weekdaySpending;
  if (totalExp > 0 && weekendSpending > 0) {
    const weekendPct = roundMoney((weekendSpending / totalExp) * 100);
    if (weekendPct >= 40) {
      insights.push({
        id: 'weekend-surge',
        type: 'warning',
        title: 'Elevated Weekend Outflow',
        description: `Weekends represent ${weekendPct}% of your total outflow (₹${roundMoney(weekendSpending).toLocaleString('en-IN')}). Consider setting weekend leisure limits.`,
        metrics: [
          { label: 'Weekend Share', value: `${weekendPct}%` },
          { label: 'Weekend Outflow', value: `₹${roundMoney(weekendSpending).toLocaleString('en-IN')}` }
        ]
      });
    }
  }

  // 5. Budget overruns
  const overBudgets = budgets.filter(b => (b.spent || 0) > b.amount);
  if (overBudgets.length > 0) {
    insights.push({
      id: 'budget-overrun',
      type: 'alert',
      title: `${overBudgets.length} Budget${overBudgets.length > 1 ? 's' : ''} Exceeded`,
      description: `You have exceeded limits in: ${overBudgets.map(b => b.name).join(', ')}. Review these categories to avoid further cashflow strain.`,
      metrics: [
        { label: 'Exceeded Limits', value: `${overBudgets.length}` }
      ]
    });
  }

  return insights;
}

/**
 * Explainable Spending Health Score Engine (0-100)
 * Uses 4 deterministic dimensions with documented weights:
 * 1. Budget Adherence (40%)
 * 2. Net Savings Rate (30%)
 * 3. Fixed / Recurring Burden (15%)
 * 4. Spending Volatility & Discipline (15%)
 */
export function calculateSpendingHealthScore(
  summary: FinancialSummary,
  recurringTotal: number = 0,
  transactionCount: number = 0
): SpendingHealthScore {
  // If user has zero recorded transactions, provide an onboarding state
  if (transactionCount === 0 || (summary.totalIncome === 0 && summary.totalExpenses === 0)) {
    return {
      score: 50,
      grade: 'Fair',
      breakdown: {
        budgetAdherence: { score: 50, weight: 40, message: 'No budget data recorded yet.' },
        savingsRate: { score: 50, weight: 30, message: 'Record income and expenses to evaluate savings.' },
        recurringBurden: { score: 50, weight: 15, message: 'Add recurring bills to calculate overhead.' },
        volatility: { score: 50, weight: 15, message: 'Log spending to evaluate stability.' }
      }
    };
  }

  // 1. Budget Adherence (40 points)
  let budgetScore = 40;
  let budgetMsg = 'Excellent budget discipline!';
  if (summary.totalBudget > 0) {
    const util = summary.budgetUtilizationPct;
    if (util <= 80) {
      budgetScore = 40;
      budgetMsg = `Within safe budget limits (${util}% utilized).`;
    } else if (util <= 100) {
      budgetScore = 30;
      budgetMsg = `Approaching budget boundary (${util}% utilized).`;
    } else if (util <= 120) {
      budgetScore = 15;
      budgetMsg = `Moderate budget overrun (${util}% utilized).`;
    } else {
      budgetScore = 5;
      budgetMsg = `Critical budget overrun (${util}% utilized).`;
    }
  } else {
    // If no budget configured, evaluate expense to income ratio
    const ratio = summary.totalIncome > 0 ? (summary.totalExpenses / summary.totalIncome) : 1;
    if (ratio < 0.6) budgetScore = 35;
    else if (ratio < 0.8) budgetScore = 25;
    else budgetScore = 10;
    budgetMsg = 'Based on expense-to-income ratio (consider setting category budgets).';
  }

  // 2. Savings Rate (30 points)
  let savingsScore = 0;
  let savingsMsg = '';
  const sRate = summary.savingsRate;
  if (sRate >= 30) {
    savingsScore = 30;
    savingsMsg = `Outstanding savings rate of ${sRate}%.`;
  } else if (sRate >= 20) {
    savingsScore = 24;
    savingsMsg = `Healthy savings rate of ${sRate}%.`;
  } else if (sRate >= 10) {
    savingsScore = 18;
    savingsMsg = `Moderate savings rate of ${sRate}%. Target is 20%+.`;
  } else if (sRate > 0) {
    savingsScore = 10;
    savingsMsg = `Low positive savings rate of ${sRate}%.`;
  } else {
    savingsScore = 2;
    savingsMsg = 'Negative cash flow: expenses exceed income.';
  }

  // 3. Fixed / Recurring Burden (15 points)
  let recurringScore = 15;
  let recurringMsg = 'Low fixed overhead.';
  if (summary.totalIncome > 0 && recurringTotal > 0) {
    const burden = (recurringTotal / summary.totalIncome) * 100;
    if (burden <= 30) {
      recurringScore = 15;
      recurringMsg = `Fixed bills account for ${roundMoney(burden)}% of income (comfortable).`;
    } else if (burden <= 50) {
      recurringScore = 10;
      recurringMsg = `Fixed bills account for ${roundMoney(burden)}% of income (moderate).`;
    } else {
      recurringScore = 4;
      recurringMsg = `High fixed commitments (${roundMoney(burden)}% of income).`;
    }
  } else {
    recurringScore = 12;
    recurringMsg = 'No excessive recurring liabilities recorded.';
  }

  // 4. Spending Volatility & Discipline (15 points)
  let volatilityScore = 12;
  let volMsg = 'Spending pace is consistent.';
  if (summary.momExpenseChangePct > 35) {
    volatilityScore = 5;
    volMsg = `Spending spiked by ${summary.momExpenseChangePct}% compared to prior period.`;
  } else if (summary.momExpenseChangePct > 15) {
    volatilityScore = 9;
    volMsg = `Mild spending acceleration (+${summary.momExpenseChangePct}%).`;
  } else {
    volatilityScore = 15;
    volMsg = 'Expense outflow is controlled and predictable.';
  }

  const finalScore = Math.min(100, Math.max(0, budgetScore + savingsScore + recurringScore + volatilityScore));

  let grade: SpendingHealthScore['grade'] = 'Needs Attention';
  if (finalScore >= 80) grade = 'Excellent';
  else if (finalScore >= 65) grade = 'Good';
  else if (finalScore >= 50) grade = 'Fair';

  return {
    score: Math.round(finalScore),
    grade,
    breakdown: {
      budgetAdherence: { score: budgetScore, weight: 40, message: budgetMsg },
      savingsRate: { score: savingsScore, weight: 30, message: savingsMsg },
      recurringBurden: { score: recurringScore, weight: 15, message: recurringMsg },
      volatility: { score: volatilityScore, weight: 15, message: volMsg }
    }
  };
}

/**
 * What-If Savings Calculator
 * Computes hypothetical wealth accumulation and goal time acceleration
 */
export interface WhatIfSimulation {
  categoryName: string;
  monthlyReduction: number;
  months: number;
  totalSaved: number;
  potentialAnnualCompound: number; // 7% standard Indian liquid mutual fund / FD rate assumption
}

export function simulateSavings(
  categoryName: string,
  monthlyReduction: number,
  months: number,
  annualInterestRate: number = 7.0
): WhatIfSimulation {
  const reduction = Math.max(0, monthlyReduction);
  const totalSaved = roundMoney(reduction * months);

  // Future value calculation with compounding: FV = P * [((1 + r/n)^(nt) - 1) / (r/n)]
  const monthlyRate = annualInterestRate / 100 / 12;
  let compoundFV = 0;
  if (monthlyRate > 0) {
    compoundFV = reduction * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    compoundFV = totalSaved;
  }

  return {
    categoryName,
    monthlyReduction: reduction,
    months,
    totalSaved,
    potentialAnnualCompound: roundMoney(compoundFV)
  };
}
