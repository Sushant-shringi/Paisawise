import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [step, setStep] = useState<'enter_email' | 'enter_otp' | 'verified'>('enter_email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. Send OTP to actual email inbox
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP.');
      } else {
        setMessage('A 6-digit verification code has been sent to your email inbox.');
        setStep('enter_otp');
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to local server.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP entered by user
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !otp.trim()) {
      setError('Please enter the OTP.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          purpose: 'email_verification'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        // Specific requirement messages: "Invalid OTP" or "OTP expired. Please request a new one"
        setError(data.error || 'Invalid OTP');
      } else {
        // Specific requirement message: "Email verified successfully"
        setMessage('Email verified successfully');
        setStep('verified');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      {/* Ambient background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 filter blur-sm"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
                            radial-gradient(circle at 80% 40%, rgba(245, 158, 11, 0.2) 0%, transparent 55%),
                            linear-gradient(to bottom, #090d16, #0f172a)`
        }}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-slate-900/60 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-white">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/20">
            ₹
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Paisa<span className="text-emerald-400">Wise</span>
          </span>
        </div>

        {/* STATUS 1: VERIFIED SUCCESSFULLY */}
        {step === 'verified' ? (
          <div className="text-center space-y-4 py-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Email verified successfully
            </h3>
            <p className="text-xs text-slate-300">
              Your email address <strong className="text-emerald-400">{email}</strong> has been verified.
            </p>
            <div className="pt-3">
              <Link to="/login">
                <button
                  type="button"
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  Continue to Sign In
                </button>
              </Link>
            </div>
          </div>
        ) : step === 'enter_otp' ? (
          /* STATUS 2: ENTER OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Enter Verification Code</h3>
              <p className="text-xs text-slate-300 mt-1">
                A 6-digit code was sent to <strong className="text-emerald-400">{email}</strong>
              </p>
            </div>

            {message && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="w-full text-center tracking-[0.5em] text-2xl font-black px-4 py-3 rounded-xl bg-slate-950/80 border border-white/20 text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isLoading}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('enter_email');
                  setOtp('');
                  setError(null);
                  setMessage(null);
                }}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email</span>
              </button>
            </div>
          </form>
        ) : (
          /* STATUS 3: ENTER EMAIL ADDRESS */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Email OTP Verification</h3>
              <p className="text-xs text-slate-300 mt-1">
                Enter your email address to receive a secure six-digit verification code.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
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
              className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? 'Sending Code...' : 'Send OTP to Email'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-slate-400 hover:text-white">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
