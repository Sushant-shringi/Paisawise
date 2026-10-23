import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/calculations/currency';
import { calculateSuggestedGoalContribution } from '@/lib/calculations/financeCalculations';
import { Target, Plus, CheckCircle2, TrendingUp, AlertCircle, Info, Edit2, Trash2 } from 'lucide-react';
import { SavingsGoal } from '@/types';
import { format } from 'date-fns';

export const SavingsGoals: React.FC = () => {
  const { savingsGoals, createGoal, updateGoal, deleteGoal, contributeToGoal } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Create/Edit form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState<string | null>(null);

  // Deposit form
  const [depositAmount, setDepositAmount] = useState('');

  const openCreateModal = () => {
    setSelectedGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);
    setTargetDate(format(futureDate, 'yyyy-MM-dd'));
    setDescription('');
    setColor('#10b981');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.target_amount));
    setCurrentAmount(String(goal.current_amount));
    setTargetDate(goal.target_date);
    setDescription(goal.description || '');
    setColor(goal.color || '#10b981');
    setError(null);
    setIsModalOpen(true);
  };

  const openDepositModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setIsDepositModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount) || 0;

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please provide a valid target amount greater than zero');
      return;
    }
    if (!name.trim()) {
      setError('Goal name is required');
      return;
    }

    try {
      if (selectedGoal) {
        await updateGoal(selectedGoal.id, {
          name: name.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent,
          target_date: targetDate,
          description: description.trim() || null,
          color,
          status: parsedCurrent >= parsedTarget ? 'completed' : 'in_progress'
        });
      } else {
        await createGoal({
          user_id: 'demo',
          name: name.trim(),
          target_amount: parsedTarget,
          current_amount: parsedCurrent,
          target_date: targetDate,
          description: description.trim() || undefined,
          color,
          status: parsedCurrent >= parsedTarget ? 'completed' : 'in_progress'
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount === 0) return;

    await contributeToGoal(selectedGoal.id, amount);
    setIsDepositModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Savings Goals & Milestones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Automate your target math, calculate suggested monthly deposits, and celebrate wins.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Goal
        </Button>
      </div>

      {/* Financial disclaimer */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Transparency Notice:</strong> Manually recorded goal contributions represent your personal tracking ledger and do not move money from real bank accounts.
        </span>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.map((goal) => {
          const stats = calculateSuggestedGoalContribution(goal);
          const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
          const isCompleted = goal.status === 'completed' || pct >= 100;

          return (
            <Card key={goal.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: goal.color || '#10b981' }}
                    />
                    <CardTitle className="truncate">{goal.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete goal "${goal.name}"?`)) deleteGoal(goal.id);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {goal.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium">Saved so far</span>
                      <h4 className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(goal.current_amount)}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-medium">Target</span>
                      <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 font-mono">
                        {formatCurrency(goal.target_amount)}
                      </h4>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: goal.color || '#10b981'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2 font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{pct}% Achieved</span>
                      <span className="text-slate-400">{formatCurrency(stats.remainingAmount)} to go</span>
                    </div>
                  </div>

                  {/* Monthly Suggestion Box */}
                  {!isCompleted && (
                    <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                        Suggested Monthly Savings
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {formatCurrency(stats.suggestedMonthly)} / mo
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Target: {goal.target_date} ({stats.monthsRemaining} mos)
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>

              {/* Action footer */}
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {isCompleted ? (
                  <Badge variant="success">Milestone Reached! 🎉</Badge>
                ) : (
                  <Badge variant="info">In Progress</Badge>
                )}

                <Button
                  onClick={() => openDepositModal(goal)}
                  variant="outline"
                  size="sm"
                  leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Contribute
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
        description="Define a target amount and deadline for your milestone."
      >
        <form onSubmit={handleSaveGoal} className="space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Emergency Fund, New Laptop, Goa Trip"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Target Amount (₹)"
              type="number"
              placeholder="100000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
            <Input
              label="Initial / Current Saved (₹)"
              type="number"
              placeholder="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>

          <Input
            label="Target Deadline"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Goal Purpose & Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why this goal matters, where the fund is stored..."
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {selectedGoal ? 'Update Goal' : 'Save Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title={`Contribute to "${selectedGoal?.name}"`}
        description="Add money to your tracked goal buffer."
      >
        <form onSubmit={handleDeposit} className="space-y-4">
          <Input
            label="Deposit Amount (₹)"
            type="number"
            step="any"
            placeholder="5000"
            autoFocus
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
          />

          <p className="text-xs text-slate-400">
            Current balance: {formatCurrency(selectedGoal?.current_amount || 0)} / {formatCurrency(selectedGoal?.target_amount || 0)}
          </p>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDepositModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Contribution
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
