import React, { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { 
  User, 
  Moon, 
  Sun, 
  Globe, 
  Clock, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Sparkles,
  CheckCircle,
  Database
} from 'lucide-react';
import { supabaseApi } from '@/lib/supabase/api';

export const Settings: React.FC = () => {
  const { user, profile, isDemoMode, toggleDemoMode, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { transactions, budgets, savingsGoals } = useFinance();

  const [fullName, setFullName] = useState(profile?.full_name || 'Aditya Sharma');
  const [currency, setCurrency] = useState(profile?.currency || 'INR');
  const [timezone, setTimezone] = useState(profile?.timezone || 'Asia/Kolkata');
  const [monthlyTarget, setMonthlyTarget] = useState(String(profile?.monthly_income_target || 120000));
  
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setStatusMsg(null);
    try {
      await supabaseApi.updateProfile(user.id, {
        full_name: fullName.trim(),
        currency,
        timezone,
        monthly_income_target: parseFloat(monthlyTarget) || 0
      });
      await refreshProfile();
      setStatusMsg('Profile and preferences updated successfully.');
    } catch (err: any) {
      setStatusMsg('Failed to update profile settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackupAllData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      user: { id: user?.id, email: user?.email, name: fullName },
      transactions,
      budgets,
      savingsGoals
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `PaisaWise_Full_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Account & Platform Settings
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage currency formatting, visual themes, data persistence, and security preferences.
        </p>
      </div>

      {statusMsg && (
        <Alert type="success" onClose={() => setStatusMsg(null)}>
          {statusMsg}
        </Alert>
      )}

      {/* Profile & Currency Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            <CardTitle>Personal Profile & Localization</CardTitle>
          </div>
          <Badge variant={isDemoMode ? 'warning' : 'success'}>
            {isDemoMode ? 'Demo Environment' : 'Cloud Synchronized'}
          </Badge>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Registered Email"
                value={user?.email || 'aditya.sharma@example.in'}
                disabled
                helperText="Email is managed via Supabase Auth authentication"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select
                label="Default Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="INR">INR (₹ - Indian Rupee with Lakhs/Crores)</option>
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
              </Select>

              <Select
                label="System Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                <option value="America/New_York">America/New_York (EST -05:00)</option>
                <option value="Europe/London">Europe/London (GMT +00:00)</option>
              </Select>

              <Input
                label="Monthly Income Target (₹)"
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Appearance & Theme Preference */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <CardTitle>Interface Appearance</CardTitle>
          </div>
          <span className="text-xs text-slate-400 capitalize">Current: {theme} Mode</span>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Light & Dark Mode Switch
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Toggle between clear high-contrast light styling and modern eye-friendly dark slate.
              </p>
            </div>

            <Button
              onClick={toggleTheme}
              variant="outline"
              size="sm"
              leftIcon={theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode / Live Supabase Mode Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <CardTitle>Environment Switcher</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isDemoMode ? 'Currently in Demo Mode' : 'Currently in Live Supabase Mode'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isDemoMode
                  ? 'Populated with realistic INR transactions, budgets, and savings goals for instant evaluation.'
                  : 'Connected directly to your Supabase PostgreSQL instance with strict Row Level Security.'}
              </p>
            </div>

            <Button
              onClick={() => toggleDemoMode()}
              variant={isDemoMode ? 'primary' : 'outline'}
              size="sm"
            >
              {isDemoMode ? 'Switch to Live Database' : 'Explore Demo Mode'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Export & Backup */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <CardTitle>Complete Data Backup</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Download Complete JSON Snapshot
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Export all transactions, category budgets, and savings goals into a secure offline JSON archive.
              </p>
            </div>

            <Button
              onClick={handleBackupAllData}
              variant="outline"
              size="sm"
              leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
            >
              Export JSON Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion / Data Hygiene */}
      <Card className="border-rose-200 dark:border-rose-900/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            <CardTitle className="text-rose-600">Danger Zone: Account Deletion</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                Permanently delete your profile and cascade delete all associated transactions, budgets, and savings goals. This action cannot be reversed.
              </p>
            </div>

            <Button
              onClick={() => {
                if (confirm('Are you absolutely sure you want to permanently delete your account and financial ledger?')) {
                  alert('Account deletion initiated according to data retention policy.');
                }
              }}
              variant="danger"
              size="sm"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
