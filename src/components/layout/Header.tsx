import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Bell, 
  Menu, 
  Calendar as CalendarIcon, 
  CheckCheck, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from 'date-fns';
import clsx from 'clsx';

interface HeaderProps {
  onToggleMobileNav: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  const location = useLocation();
  const { 
    dateRange, 
    setDateRange, 
    notifications, 
    unreadNotificationCount, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useFinance();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const titles: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Dashboard', subtitle: 'Overview of your cashflow & financial pulse' },
    '/transactions': { title: 'Transactions', subtitle: 'Manage, search, and categorize your income and expenses' },
    '/budgets': { title: 'Budgets', subtitle: 'Set monthly targets and monitor utilization' },
    '/analytics': { title: 'Analytics', subtitle: 'Deep dive into spending patterns & trends' },
    '/goals': { title: 'Savings Goals', subtitle: 'Track and achieve your financial milestones' },
    '/recurring': { title: 'Recurring & Bills', subtitle: 'Subscriptions and predictable commitments' },
    '/calendar': { title: 'Financial Calendar', subtitle: 'Daily money flow & upcoming payment dates' },
    '/reports': { title: 'Reports & Exports', subtitle: 'Generate month-end reports, PDFs & CSVs' },
    '/sheets': { title: 'Google Sheets Integration', subtitle: 'Bi-directional spreadsheet sync & backups' },
    '/settings': { title: 'Settings', subtitle: 'Preferences, profile, and data management' },
  };

  const currentMeta = titles[location.pathname] || { title: 'PaisaWise', subtitle: 'Smart Personal Finance' };

  // Date range presets
  const selectPreset = (type: 'this-month' | 'last-month' | 'last-30' | 'ytd') => {
    const now = new Date();
    if (type === 'this-month') {
      setDateRange({
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    } else if (type === 'last-month') {
      const prev = subMonths(now, 1);
      setDateRange({
        startDate: format(startOfMonth(prev), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(prev), 'yyyy-MM-dd'),
      });
    } else if (type === 'last-30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      setDateRange({
        startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
        endDate: format(now, 'yyyy-MM-dd'),
      });
    } else if (type === 'ytd') {
      setDateRange({
        startDate: format(startOfYear(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      });
    }
    setIsDateOpen(false);
  };

  const formattedDateRangeDisplay = () => {
    try {
      const s = new Date(dateRange.startDate);
      const e = new Date(dateRange.endDate);
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return format(s, 'MMMM yyyy');
      }
      return `${format(s, 'd MMM')} - ${format(e, 'd MMM yyyy')}`;
    } catch {
      return 'Current Period';
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & Page Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
            {currentMeta.title}
          </h1>
          <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Date Range Filter + Notification Center */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date Filter Dropdown */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-colors"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{formattedDateRangeDisplay()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDateOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs">
              <div className="px-3 py-2 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                Select Time Window
              </div>
              <button
                onClick={() => selectPreset('this-month')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                This Month (Default)
              </button>
              <button
                onClick={() => selectPreset('last-month')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Last Month
              </button>
              <button
                onClick={() => selectPreset('last-30')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => selectPreset('ytd')}
                className="w-full text-left px-3 py-2 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                Year to Date
              </button>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                      {unreadNotificationCount} New
                    </span>
                  )}
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsRead()}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new alerts or notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      className={clsx(
                        'p-3.5 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer flex items-start gap-3',
                        !n.read_at && 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      )}
                    >
                      <div className={clsx(
                        'w-2 h-2 rounded-full mt-1.5 shrink-0',
                        n.read_at ? 'bg-slate-300 dark:bg-slate-700' : 'bg-emerald-500'
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h6 className="font-bold text-slate-900 dark:text-slate-100">{n.title}</h6>
                          <span className="text-[10px] text-slate-400">{format(new Date(n.created_at), 'd MMM')}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
