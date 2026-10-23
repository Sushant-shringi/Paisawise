import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, PieChart, FileText, Plus } from 'lucide-react';
import clsx from 'clsx';

interface MobileNavProps {
  onOpenQuickAdd: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenQuickAdd }) => {
  const items = [
    { label: 'Home', path: '/', icon: LayoutDashboard },
    { label: 'Activity', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Budgets', path: '/budgets', icon: PieChart },
    { label: 'Reports', path: '/reports', icon: FileText },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 py-1.5 flex items-center justify-around shadow-lg">
      <NavLink
        to={items[0].path}
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-lg transition-colors',
            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          )
        }
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{items[0].label}</span>
      </NavLink>

      <NavLink
        to={items[1].path}
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-lg transition-colors',
            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          )
        }
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span>{items[1].label}</span>
      </NavLink>

      {/* Floating Center Quick-Add Button */}
      <button
        onClick={onOpenQuickAdd}
        aria-label="Add Transaction"
        className="relative -top-3 w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      <NavLink
        to={items[2].path}
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-lg transition-colors',
            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          )
        }
      >
        <PieChart className="w-5 h-5" />
        <span>{items[2].label}</span>
      </NavLink>

      <NavLink
        to={items[3].path}
        className={({ isActive }) =>
          clsx(
            'flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-lg transition-colors',
            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
          )
        }
      >
        <FileText className="w-5 h-5" />
        <span>{items[3].label}</span>
      </NavLink>
    </nav>
  );
};
