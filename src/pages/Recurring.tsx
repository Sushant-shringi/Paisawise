import React, { useState } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/calculations/currency';
import { 
  Repeat, 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle, 
  CreditCard, 
  Tv, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { RecurringExpense, Subscription, Frequency } from '@/types';
import { format, differenceInDays, parseISO } from 'date-fns';

export const Recurring: React.FC = () => {
  const { 
    recurringExpenses, 
    subscriptions, 
    categories, 
    recurringSummary,
    createRecurring,
    deleteRecurring,
    createSubscription,
    deleteSubscription
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'recurring' | 'subscriptions'>('recurring');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const openCreateModal = () => {
    setTitle('');
    setAmount('');
    setFrequency('monthly');
    setNextDueDate(format(new Date(), 'yyyy-MM-dd'));
    setCategoryId('');
    setWebsiteUrl('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    if (activeTab === 'recurring') {
      await createRecurring({
        user_id: 'demo',
        title: title.trim(),
        amount: parsedAmount,
        frequency,
        next_due_date: nextDueDate,
        reminder_enabled: true,
        active: true,
        category_id: categoryId || undefined
      });
    } else {
      await createSubscription({
        user_id: 'demo',
        name: title.trim(),
        amount: parsedAmount,
        billing_cycle: frequency as any,
        next_billing_date: nextDueDate,
        reminder_enabled: true,
        active: true,
        website_url: websiteUrl.trim() || undefined,
        category_id: categoryId || undefined
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Recurring Expenses & Subscriptions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit fixed commitments, track renewal dates, and optimize monthly cash burn.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {activeTab === 'recurring' ? 'Add Recurring Bill' : 'Add Subscription'}
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Monthly Fixed Burden
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(recurringSummary.monthlyTotal)} / mo
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Normalized monthly recurring outflow
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Annualized Overhead
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
            {formatCurrency(recurringSummary.yearlyTotal)} / yr
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            Total cost over a 12-month period
          </p>
        </Card>

        <Card className="p-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Active Commitments
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {recurringSummary.activeCount} Subscriptions & Bills
          </h3>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            All reminders configured
          </p>
        </Card>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('recurring')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'recurring'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Fixed Bills & Rent ({recurringExpenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'subscriptions'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span>Digital Subscriptions & Memberships ({subscriptions.length})</span>
        </button>
      </div>

      {/* Tab 1: Recurring Bills */}
      {activeTab === 'recurring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recurringExpenses.map((item) => {
            const daysLeft = differenceInDays(parseISO(item.next_due_date), new Date());
            const isDueSoon = daysLeft >= 0 && daysLeft <= 7;

            return (
              <Card key={item.id} hoverEffect className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{item.title}</h4>
                    <span className="text-xs text-slate-400 capitalize">{item.frequency} frequency</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${item.title}"?`)) deleteRecurring(item.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(item.amount)}
                  </span>
                  <Badge variant={isDueSoon ? 'warning' : 'default'}>
                    Due: {item.next_due_date}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {daysLeft < 0 ? 'Due date passed' : daysLeft === 0 ? 'Due Today!' : `In ${daysLeft} days`}
                  </span>
                  {item.reminder_enabled && (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      In-app alerts on
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 2: Subscriptions */}
      {activeTab === 'subscriptions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const daysLeft = differenceInDays(parseISO(sub.next_billing_date), new Date());

            return (
              <Card key={sub.id} hoverEffect className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">{sub.name}</h4>
                    <span className="text-xs text-slate-400 capitalize">{sub.billing_cycle} billing</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Remove subscription "${sub.name}"?`)) deleteSubscription(sub.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(sub.amount)}
                  </span>
                  <Badge variant="purple">Next: {sub.next_billing_date}</Badge>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {sub.website_url ? (
                    <a
                      href={sub.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Manage account</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Subscription Active</span>
                  )}

                  <span className="text-slate-500 font-medium">
                    {daysLeft >= 0 ? `Renews in ${daysLeft} days` : 'Renewal due'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={activeTab === 'recurring' ? 'Add Recurring Bill' : 'Add Subscription'}
        description="Track regular payments and receive in-app due reminders."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={activeTab === 'recurring' ? 'Bill / Expense Name' : 'Subscription Name'}
            placeholder={activeTab === 'recurring' ? 'e.g. Koramangala Rent, Broadband, BESCOM' : 'e.g. Netflix, Spotify, Gym'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              placeholder="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Select
              label="Billing Cycle / Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly (Every 3 mos)</option>
              <option value="yearly">Yearly</option>
            </Select>
          </div>

          <Input
            label="Next Due Date"
            type="date"
            value={nextDueDate}
            onChange={(e) => setNextDueDate(e.target.value)}
            required
          />

          {activeTab === 'subscriptions' && (
            <Input
              label="Management URL (Optional)"
              type="url"
              placeholder="https://netflix.com/youraccount"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          )}

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
