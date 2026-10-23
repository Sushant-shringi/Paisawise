import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatCompactCurrency } from '@/lib/calculations/currency';
import { simulateSavings, WhatIfSimulation } from '@/lib/calculations/financeCalculations';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Calculator, 
  Calendar, 
  ShoppingBag,
  ArrowRight,
  Info
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

export const Analytics: React.FC = () => {
  const { 
    filteredTransactions, 
    categorySpending, 
    dailySpending, 
    expenseInsights, 
    spendingHealth,
    categories 
  } = useFinance();

  // What-If Simulator state
  const [selectedCatName, setSelectedCatName] = useState('Dining & Food');
  const [reductionAmount, setReductionAmount] = useState<number>(1500);
  const [durationMonths, setDurationMonths] = useState<number>(6);

  const simulation: WhatIfSimulation = simulateSavings(
    selectedCatName,
    reductionAmount,
    durationMonths,
    7.0
  );

  // Weekday vs Weekend calculation
  const dayBreakdown = React.useMemo(() => {
    let weekdayTotal = 0;
    let weekendTotal = 0;
    const expenses = filteredTransactions.filter(t => t.type === 'expense');

    for (const t of expenses) {
      const d = new Date(t.transaction_date).getDay();
      if (d === 0 || d === 6) weekendTotal += Number(t.amount);
      else weekdayTotal += Number(t.amount);
    }
    const sum = weekdayTotal + weekendTotal;
    return {
      weekdayTotal,
      weekendTotal,
      weekdayPct: sum > 0 ? Math.round((weekdayTotal / sum) * 100) : 0,
      weekendPct: sum > 0 ? Math.round((weekendTotal / sum) * 100) : 0,
    };
  }, [filteredTransactions]);

  // Micro transactions (< ₹200)
  const microTransactions = React.useMemo(() => {
    return filteredTransactions.filter(t => t.type === 'expense' && Number(t.amount) <= 200);
  }, [filteredTransactions]);

  const microTotal = microTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

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
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Financial Intelligence & Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deep behavioral insights, weekend vs weekday patterns, and what-if savings projections.
        </p>
      </div>

      {/* What-If Simulator Section */}
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:via-slate-900 dark:to-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <CardTitle>What-If Savings Simulator</CardTitle>
          </div>
          <Badge variant="success">Interactive Forecasting</Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Slider 1: Monthly Reduction */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span>Monthly Spending Cut</span>
                <span className="font-mono text-emerald-600 text-sm">{formatCurrency(reductionAmount)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="25000"
                step="500"
                value={reductionAmount}
                onChange={(e) => setReductionAmount(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Hypothetical cut in leisure or food expenses
              </span>
            </div>

            {/* Slider 2: Time horizon */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <span>Time Horizon</span>
                <span className="font-mono text-emerald-600 text-sm">{durationMonths} Months</span>
              </div>
              <input
                type="range"
                min="3"
                max="36"
                step="3"
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Holding duration to realize accumulated compound growth
              </span>
            </div>

            {/* Simulated Outcome Display */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Projected Cumulative Savings
                </span>
                <h3 className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-200 mt-1 font-mono">
                  {formatCurrency(simulation.totalSaved)}
                </h3>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2">
                Invested at 7% p.a. (Liquid Fund/FD) yields ≈ <strong>{formatCurrency(simulation.potentialAnnualCompound)}</strong>!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavioral Patterns: Weekday vs Weekend & Micro-Purchases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekday vs Weekend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <CardTitle>Weekday vs Weekend Velocity</CardTitle>
            </div>
            <span className="text-xs text-slate-400">Distribution</span>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Mon - Fri Spending</span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(dayBreakdown.weekdayTotal)}
                </span>
                <span className="text-[11px] text-slate-500 block font-semibold">{dayBreakdown.weekdayPct}% of total</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-medium">Sat - Sun Outflow</span>
                <span className="text-lg font-extrabold text-rose-600 font-mono">
                  {formatCurrency(dayBreakdown.weekendTotal)}
                </span>
                <span className="text-[11px] text-rose-500 block font-semibold">{dayBreakdown.weekendPct}% of total</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex">
              <div className="bg-indigo-500 h-full" style={{ width: `${dayBreakdown.weekdayPct}%` }} title="Weekdays" />
              <div className="bg-rose-500 h-full" style={{ width: `${dayBreakdown.weekendPct}%` }} title="Weekends" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dayBreakdown.weekendPct >= 35
                ? 'Notice: Over one-third of spending happens on weekends. Setting weekend dining caps can yield immediate savings.'
                : 'Balanced spending profile between workdays and weekends.'}
            </p>
          </CardContent>
        </Card>

        {/* Micro-Spending Accumulation (< ₹200) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              <CardTitle>Micro-Spending Watch (&lt; ₹200)</CardTitle>
            </div>
            <Badge variant="warning">{microTransactions.length} Orders</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Small Transactions Total</span>
                <h4 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(microTotal)}
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Avg: {formatCurrency(microTransactions.length > 0 ? microTotal / microTransactions.length : 0)} / order
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {microTransactions.length === 0 ? (
                <div className="py-4 text-center text-slate-400">No micro transactions logged.</div>
              ) : (
                microTransactions.slice(0, 5).map((t) => (
                  <div key={t.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{t.title}</span>
                      <span className="text-[10px] text-slate-400 block">{t.transaction_date} • {t.category?.name}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(t.amount)}</span>
                  </div>
                ))
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Daily teas, quick rides, and mini e-commerce orders quietly pile up over 30 days.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deterministic Insights Summary Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <CardTitle>Deterministic Expense Diagnostics</CardTitle>
          </div>
          <span className="text-xs text-slate-400">100% Grounded in Records</span>
        </CardHeader>
        <CardContent className="space-y-3">
          {expenseInsights.map((insight) => (
            <div
              key={insight.id}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{insight.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {insight.description}
                </p>
              </div>
              {insight.metrics && (
                <div className="flex flex-col gap-1 items-end shrink-0">
                  {insight.metrics.map((m, idx) => (
                    <span key={idx} className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {m.label}: {m.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
