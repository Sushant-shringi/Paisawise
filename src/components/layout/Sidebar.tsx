import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  BarChart3, 
  Target, 
  Calendar, 
  Repeat, 
  FileText, 
  Sheet, 
  Settings, 
  PlusCircle, 
  LogOut, 
  Moon, 
  Sun,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import clsx from 'clsx';

interface SidebarProps {
  onOpenQuickAdd: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickAdd, isOpen, onClose }) => {
  const { user, profile, isDemoMode, toggleDemoMode, signOut } = useAuth();
  const { theme, toggleTheme, themeConfig } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Budgets', path: '/budgets', icon: PieChart },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Savings Goals', path: '/goals', icon: Target },
    { label: 'Recurring & Bills', path: '/recurring', icon: Repeat },
    { label: 'Financial Calendar', path: '/calendar', icon: Calendar },
    { label: 'Reports', path: '/reports', icon: FileText },
    { label: 'Google Sheets', path: '/sheets', icon: Sheet },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-emerald-500/20">
              ₹
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Paisa<span className="text-emerald-600 dark:text-emerald-400">Wise</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">Smart Money Management</p>
            </div>
          </div>
        </div>

        {/* Mode Pill */}
        <div className="px-4 pt-3 pb-1">
          {isDemoMode ? (
            <button
              onClick={() => toggleDemoMode(false)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/50 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
              title="Click to switch to live authenticated mode"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Demo Mode Active
              </span>
              <span className="underline text-[10px]">Go Live</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Supabase Cloud Connected</span>
            </div>
          )}
        </div>

        {/* Quick Add Button */}
        <div className="px-4 py-2">
          <button
            onClick={() => {
              onClose();
              onOpenQuickAdd();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-600/30 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-colors duration-150',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User Area */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'user@paisawise.app'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme mode"
                className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                title={`Current Theme: ${themeConfig.name}. Click to switch mode.`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: themeConfig.accentColor }} />
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              </button>
              <button
                onClick={handleLogout}
                aria-label="Logout"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
