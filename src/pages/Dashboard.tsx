import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatCompactCurrency } from '@/lib/calculations/currency';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Link } from 'react-router-dom';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { Transaction } from '@/types';
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher';
import { useTheme } from '@/context/ThemeContext';

export const Dashboard: React.FC = () => {
  const { 
    financialSummary, 
    categorySpending, 
    dailySpending, 
    filteredTransactions, 
    expenseInsights,
    spendingHealth,
    budgets,
    savingsGoals,
    deleteTransaction
  } = useFinance();

  const { themeConfig } = useTheme();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const recentTransactions = filteredTransactions.slice(0, 6);

  // Custom Recharts Tooltip for INR
  const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg shadow-lg text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="font-semibold" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* PaisaWise Themes Bar (User Customization) */}
      <ThemeSwitcher variant="pill-bar" className="w-full" />

      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time cash flow, category distributions, and actionable insights.
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedTx(null);
            setIsAddModalOpen(true);
          }}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Transaction
        </Button>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:via-slate-900 dark:to-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Income
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {formatCurrency(financialSummary.totalIncome)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {financialSummary.momIncomeChangePct !== 0 ? (
                <span className={`flex items-center font-bold ${financialSummary.momIncomeChangePct > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {financialSummary.momIncomeChangePct > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(financialSummary.momIncomeChangePct)}% vs prior
                </span>
              ) : (
                <span className="text-slate-400">Current period records</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="relative overflow-hidden border-rose-500/20 bg-gradient-to-br from-rose-500/5 via-white to-white dark:via-slate-900 dark:to-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {formatCurrency(financialSummary.totalExpenses)}
            </h3>
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              {financialSummary.momExpenseChangePct !== 0 ? (
                <span className={`flex items-center font-bold ${financialSummary.momExpenseChangePct > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {financialSummary.momExpenseChangePct > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {Math.abs(financialSummary.momExpenseChangePct)}% vs prior
                </span>
              ) : (
                <span className="text-slate-400">Current period outflow</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Net Cash Flow Card */}
        <Card className="relative overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-white to-white dark:via-slate-900 dark:to-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Net Cash Flow
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h3 className={`text-2xl font-extrabold mt-2 ${financialSummary.netCashFlow >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'}`}>
              {formatCurrency(financialSummary.netCashFlow)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-2">
              Income minus expenses (savings rate: {financialSummary.savingsRate}%)
            </p>
          </CardContent>
        </Card>

        {/* Budget Remaining Card */}
        <Card className="relative overflow-hidden border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-white to-white dark:via-slate-900 dark:to-slate-900">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Remaining Budget
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {formatCurrency(financialSummary.budgetRemaining)}
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
              <div 
                className={`h-1.5 rounded-full ${financialSummary.budgetUtilizationPct > 100 ? 'bg-rose-500' : financialSummary.budgetUtilizationPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, financialSummary.budgetUtilizationPct)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {financialSummary.budgetUtilizationPct}% of {formatCurrency(financialSummary.totalBudget)} limit used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spending Health Score & Deterministic Insights Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <CardTitle>Spending Health Pulse</CardTitle>
            </div>
            <Badge variant={spendingHealth.grade === 'Excellent' || spendingHealth.grade === 'Good' ? 'success' : 'warning'}>
              {spendingHealth.grade}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center p-4">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-emerald-500/20 bg-emerald-500/5">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{spendingHealth.score}</span>
                  <span className="text-xs text-slate-400 block font-semibold">out of 100</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Budget Adherence (40%)</span>
                <span className="font-bold text-slate-900 dark:text-white">{spendingHealth.breakdown.budgetAdherence.score}/40</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Savings Rate (30%)</span>
                <span className="font-bold text-slate-900 dark:text-white">{spendingHealth.breakdown.savingsRate.score}/30</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Fixed Overhead Burden (15%)</span>
                <span className="font-bold text-slate-900 dark:text-white">{spendingHealth.breakdown.recurringBurden.score}/15</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Spending Volatility (15%)</span>
                <span className="font-bold text-slate-900 dark:text-white">{spendingHealth.breakdown.volatility.score}/15</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Score grounded deterministically in your recorded transaction discipline.
            </p>
          </CardContent>
        </Card>

        {/* Factual Insights Engine */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <CardTitle>Expense Insights Engine</CardTitle>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Deterministic Analytics</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenseInsights.length === 0 ? (
              <p className="text-xs text-slate-400">No transactions recorded to calculate insights.</p>
            ) : (
              expenseInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start gap-3"
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    insight.type === 'alert' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' :
                    insight.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' :
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                  }`}>
                    {insight.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">{insight.title}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.metrics && (
                      <div className="flex items-center gap-4 mt-2">
                        {insight.metrics.map((m, idx) => (
                          <span key={idx} className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {m.label}: {m.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Financial Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cashflow Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Outflow & Inflow</CardTitle>
            <span className="text-xs text-slate-400">Selected Interval</span>
          </CardHeader>
          <CardContent className="h-72">
            {dailySpending.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recorded activity for this date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySpending} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="dayLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(val) => formatCompactCurrency(val)} />
                  <Tooltip content={<CustomCurrencyTooltip />} />
                  <Bar dataKey="income" name="Income" fill={themeConfig.accentColor} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Category-Wise Outflow</CardTitle>
            <span className="text-xs text-slate-400">Expense Distribution</span>
          </CardHeader>
          <CardContent className="h-72 flex flex-col sm:flex-row items-center justify-between">
            {categorySpending.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                No expense records to categorize.
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categorySpending}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                      >
                        {categorySpending.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomCurrencyTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend list */}
                <div className="w-full sm:w-1/2 max-h-56 overflow-y-auto space-y-2 text-xs pr-2">
                  {categorySpending.map((cat) => (
                    <div key={cat.categoryId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{cat.categoryName}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(cat.amount)}</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions List with Quick Action */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <Link
            to="/transactions"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View All Activity</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No recent transactions recorded. Click "Add Transaction" to log an expense or income.
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                    style={{ backgroundColor: tx.category?.color || '#10b981' }}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{tx.title}</h5>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{tx.transaction_date}</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {tx.category?.name || 'Uncategorized'}
                      </span>
                      <span>•</span>
                      <span>{tx.payment_method}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-mono font-extrabold ${
                      tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button
                      onClick={() => {
                        setSelectedTx(tx);
                        setIsAddModalOpen(true);
                      }}
                      className="text-[11px] text-slate-400 hover:text-emerald-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTx(null);
        }}
        transactionToEdit={selectedTx}
      />
    </div>
  );
};
