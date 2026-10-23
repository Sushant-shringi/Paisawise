import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/calculations/currency';
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle, PieChart, Info } from 'lucide-react';
import { Budget } from '@/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const Budgets: React.FC = () => {
  const { budgets, categories, createBudget, updateBudget, deleteBudget } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const overallUtilization = totalBudgetLimit > 0 ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100) : 0;

  const openCreateModal = () => {
    setEditingBudget(null);
    setName('');
    setAmount('');
    setCategoryId('');
    setAlertThreshold('80');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget);
    setName(budget.name);
    setAmount(String(budget.amount));
    setCategoryId(budget.category_id || '');
    setAlertThreshold(String(budget.alert_threshold || 80));
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please provide a valid budget amount');
      return;
    }

    const matchedCat = categories.find(c => c.id === categoryId);
    const finalName = name.trim() || (matchedCat ? `${matchedCat.name} Budget` : 'Monthly Budget');

    const now = new Date();
    const startDate = format(startOfMonth(now), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(now), 'yyyy-MM-dd');

    setIsSubmitting(true);
    setError(null);
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          name: finalName,
          amount: parsedAmount,
          category_id: categoryId || null,
          alert_threshold: parseInt(alertThreshold) || 80,
        });
      } else {
        await createBudget({
          user_id: 'demo',
          name: finalName,
          amount: parsedAmount,
          category_id: categoryId || undefined,
          period: 'monthly',
          start_date: startDate,
          end_date: endDate,
          alert_threshold: parseInt(alertThreshold) || 80,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Budgets & Spending Limits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Set proactive guardrails on categories to prevent lifestyle creep and impulsive spending.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Budget
        </Button>
      </div>

      {/* Overview Metric Banner */}
      <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
              Total Monthly Planned Budget
            </span>
            <h3 className="text-3xl font-extrabold mt-1 text-white">
              {formatCurrency(totalBudgetLimit)}
            </h3>
            <p className="text-[11px] text-emerald-100 mt-1">
              Active across {budgets.length} configured budget category target(s)
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-emerald-100 mb-2 font-medium">
              <span>Overall Utilization</span>
              <span className="font-bold text-white">{overallUtilization}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 p-0.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  overallUtilization > 100 ? 'bg-rose-400' : overallUtilization > 80 ? 'bg-amber-300' : 'bg-emerald-300'
                }`}
                style={{ width: `${Math.min(100, overallUtilization)}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-100 block mt-1.5">
              {formatCurrency(totalBudgetSpent)} spent of {formatCurrency(totalBudgetLimit)} limit
            </span>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider block">
              Remaining Safe Buffer
            </span>
            <h3 className="text-2xl font-extrabold mt-1 text-white">
              {formatCurrency(Math.max(0, totalBudgetLimit - totalBudgetSpent))}
            </h3>
            <span className="text-[11px] text-emerald-100 mt-1 block">
              Planned ceiling allowance for the rest of this month
            </span>
          </div>
        </div>
      </Card>

      {/* Info note */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Note:</strong> Remaining budget represents your self-imposed monthly spending limit, not your actual bank balance.
        </span>
      </div>

      {/* Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((b) => {
          const spent = b.spent || 0;
          const percentage = b.percentage || 0;
          const isOverspent = percentage > 100;
          const isWarning = percentage >= (b.alert_threshold || 80) && !isOverspent;

          return (
            <Card key={b.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: b.category?.color || '#10b981' }}
                    />
                    <CardTitle className="truncate">{b.name}</CardTitle>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete budget "${b.name}"?`)) deleteBudget(b.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Spent</span>
                      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(spent)}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-medium">Monthly Limit</span>
                      <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 font-mono">
                        {formatCurrency(b.amount)}
                      </h4>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverspent ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {percentage}% used
                      </span>
                      {isOverspent ? (
                        <span className="text-rose-600 font-bold flex items-center gap-1 text-[11px]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Overspent by {formatCurrency(spent - b.amount)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold text-[11px]">
                          {formatCurrency(b.remaining || 0)} left
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Status footer badge */}
              <div className="px-5 py-3 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Alert set at {b.alert_threshold || 80}%</span>
                {isOverspent ? (
                  <Badge variant="danger">Budget Exceeded</Badge>
                ) : isWarning ? (
                  <Badge variant="warning">Near Threshold</Badge>
                ) : (
                  <Badge variant="success">On Track</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Spending Budget' : 'Create Category Budget'}
        description="Set monthly allowances to cap spending in key categories."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Budget Name"
            placeholder="e.g. Dining & Restaurants, Groceries, Shopping"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Monthly Limit (₹)"
            type="number"
            step="any"
            placeholder="10000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <Select
            label="Linked Expense Category (Optional)"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All Categories (Overall Budget)</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Select
            label="Alert Threshold"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(e.target.value)}
          >
            <option value="50">50% of budget reached</option>
            <option value="75">75% of budget reached</option>
            <option value="80">80% of budget reached (Recommended)</option>
            <option value="90">90% of budget reached</option>
            <option value="100">100% (Strict alert only on overspend)</option>
          </Select>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              {editingBudget ? 'Update Budget' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
