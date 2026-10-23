import React, { useState, useMemo } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/calculations/currency';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { TransactionModal } from '@/components/transactions/TransactionModal';

export const Calendar: React.FC = () => {
  const { transactions, recurringExpenses, subscriptions } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Month days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Map transactions by YYYY-MM-DD
  const txMap = useMemo(() => {
    const map = new Map<string, { income: number; expense: number; count: number }>();
    for (const t of transactions) {
      const key = t.transaction_date;
      const cur = map.get(key) || { income: 0, expense: 0, count: 0 };
      if (t.type === 'income') cur.income += Number(t.amount);
      else cur.expense += Number(t.amount);
      cur.count += 1;
      map.set(key, cur);
    }
    return map;
  }, [transactions]);

  // Selected date details
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateTransactions = useMemo(() => {
    return transactions.filter(t => t.transaction_date === selectedDateStr);
  }, [transactions, selectedDateStr]);

  // Upcoming bills matching selected date
  const selectedDateBills = useMemo(() => {
    const dayOfMonth = selectedDate.getDate();
    return [
      ...recurringExpenses.filter(r => parseISO(r.next_due_date).getDate() === dayOfMonth),
      ...subscriptions.filter(s => parseISO(s.next_billing_date).getDate() === dayOfMonth)
    ];
  }, [recurringExpenses, subscriptions, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Financial Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize income deposits, expense outflows, and scheduled bills on any given day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-900 shadow-sm">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-slate-200">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add on Date
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols) */}
        <Card className="lg:col-span-2 p-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase tracking-wider py-2">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const summary = txMap.get(dayStr);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[72px] sm:min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className={isSelected ? 'text-emerald-600 font-extrabold' : 'text-slate-700 dark:text-slate-300'}>
                      {format(day, 'd')}
                    </span>
                    {summary && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </div>

                  {summary ? (
                    <div className="space-y-0.5 text-[10px] font-mono leading-tight">
                      {summary.income > 0 && (
                        <div className="text-emerald-600 truncate font-bold">
                          +{formatCurrency(summary.income, { showDecimals: false })}
                        </div>
                      )}
                      {summary.expense > 0 && (
                        <div className="text-rose-500 truncate font-semibold">
                          -{formatCurrency(summary.expense, { showDecimals: false })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Date Inspector (1 Col) */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Selected Date
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </h3>
            </div>

            {/* List of transactions for this day */}
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Transactions ({selectedDateTransactions.length})
              </h4>

              {selectedDateTransactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No recorded transactions on this day.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {selectedDateTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{tx.title}</div>
                        <span className="text-[10px] text-slate-400">{tx.category?.name || 'Uncategorized'}</span>
                      </div>
                      <span className={`font-mono font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scheduled bills around this day */}
              {selectedDateBills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Recurring Payments Due</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {selectedDateBills.map((b: any, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 flex justify-between font-medium">
                        <span>{b.title || b.name}</span>
                        <span className="font-mono font-bold">{formatCurrency(b.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            size="sm"
            className="w-full mt-4"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Transaction on {format(selectedDate, 'd MMM')}
          </Button>
        </Card>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
