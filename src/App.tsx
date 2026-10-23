import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/features/auth/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { FinanceProvider } from '@/context/FinanceContext';
import { Layout } from '@/components/layout/Layout';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Transactions } from '@/pages/Transactions';
import { Budgets } from '@/pages/Budgets';
import { Analytics } from '@/pages/Analytics';
import { SavingsGoals } from '@/pages/SavingsGoals';
import { Recurring } from '@/pages/Recurring';
import { Calendar } from '@/pages/Calendar';
import { Reports } from '@/pages/Reports';
import { GoogleSheets } from '@/pages/GoogleSheets';
import { Settings } from '@/pages/Settings';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isDemoMode } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-xl animate-bounce">
            ₹
          </div>
          <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">Loading PaisaWise...</span>
        </div>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FinanceProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="budgets" element={<Budgets />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="goals" element={<SavingsGoals />} />
                <Route path="recurring" element={<Recurring />} />
                <Route path="calendar" element={<Calendar />} />
                <Route path="reports" element={<Reports />} />
                <Route path="sheets" element={<GoogleSheets />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FinanceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
