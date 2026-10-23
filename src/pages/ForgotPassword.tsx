import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please provide your email address');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await resetPassword(normalizedEmail);
      if (res.error) {
        setError(res.error.message);
      } else {
        // Automatically transition to the Reset Password step
        navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send recovery code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      {/* Cinematic Ambient Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 filter blur-sm"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
                            radial-gradient(circle at 80% 40%, rgba(245, 158, 11, 0.2) 0%, transparent 55%),
                            linear-gradient(to bottom, #090d16, #0f172a)`
        }}
      />

      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Frosted Glass Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-slate-900/60 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-white">
        
        {/* Brand Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/20">
            ₹
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Paisa<span className="text-emerald-400">Wise</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white">Forgot Password</h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your account email to receive your 6-digit recovery code.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Sending Recovery Code...' : 'Send Recovery Code'}
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
