import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Sparkles, 
  KeyRound,
  RotateCw,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import clsx from 'clsx';

export const Login: React.FC<{ initialMode?: 'signin' | 'signup' }> = ({ initialMode }) => {
  const { signIn, signUp, verifyOtp, requestOtp, toggleDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Tab state: 'signin' or 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(() => {
    if (initialMode) return initialMode;
    return location.pathname === '/register' ? 'signup' : 'signin';
  });

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Verification state
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);

  // Sign In handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await signIn(email, password);
      if (res.error) {
        setError(res.error.message);
      } else if (res.requiresVerification) {
        setOtpEmail(res.email || email);
        setOtpStep(true);
        if (res.devOtp) {
          setDevOtpNotice(res.devOtp);
          setOtpCode(res.devOtp);
        }
        setOtpNotice('Email verification required. Enter your 6-digit OTP code below.');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await signUp(email, password, fullName);
      if (res.error) {
        setError(res.error.message);
      } else if (res.requiresVerification) {
        setOtpEmail(res.email || email);
        setOtpStep(true);
        if (res.devOtp) {
          setDevOtpNotice(res.devOtp);
          setOtpCode(res.devOtp);
        }
        setOtpNotice(res.message || `Verification code generated for ${res.email || email}.`);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Account creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Submit handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setIsVerifyingOtp(true);
    setError(null);
    try {
      const res = await verifyOtp(otpEmail, otpCode.trim());
      if (res.error) {
        setError(res.error.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setError(null);
    try {
      const res = await requestOtp(otpEmail);
      if (res.error) {
        setError(res.error.message);
      } else {
        if (res.devOtp) {
          setDevOtpNotice(res.devOtp);
          setOtpCode(res.devOtp);
        }
        setOtpNotice(res.message || 'A fresh verification OTP has been generated.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request new OTP');
    }
  };

  // Fetch Dev Active OTP (Local dev only)
  const handleFetchDevOtp = async () => {
    try {
      const res = await fetch(`/api/auth/dev-active-otp?email=${encodeURIComponent(otpEmail)}`, {
        headers: { 'x-dev-test-token': 'paisawise-internal-test-key' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.otp) {
          setOtpCode(data.otp);
          setDevOtpNotice(data.otp);
        } else {
          setError('No active OTP found for this account.');
        }
      }
    } catch {
      setError('Could not retrieve local test OTP.');
    }
  };

  // Google OAuth click
  const handleGoogleSignIn = () => {
    toggleDemoMode(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950">
      {/* Cinematic Ambient Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 filter blur-sm"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.25) 0%, transparent 50%),
                            radial-gradient(circle at 80% 40%, rgba(245, 158, 11, 0.2) 0%, transparent 55%),
                            radial-gradient(circle at 50% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                            linear-gradient(to bottom, #090d16, #0f172a)`
        }}
      />
      
      {/* Decorative ambient blurred orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Frosted Glass Card */}
      <div className="relative z-10 w-full max-w-md sm:max-w-lg rounded-3xl p-6 sm:p-8 backdrop-blur-2xl bg-slate-900/60 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-white">
        
        {/* OTP STEP VIEW */}
        {otpStep ? (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Email Verification</h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Enter the 6-digit security code for <strong className="text-emerald-400">{otpEmail}</strong>
              </p>
            </div>

            {otpNotice && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{otpNotice}</span>
              </div>
            )}

            {devOtpNotice && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-400/40 text-left shadow-lg shadow-emerald-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-300">Your Security Code:</span>
                  </div>
                  <span className="text-lg font-black tracking-widest text-emerald-400 bg-emerald-900/80 px-3 py-1 rounded-lg border border-emerald-400/40 font-mono">
                    {devOtpNotice}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                  ✓ Code autofilled below. Click <strong className="text-white">Verify & Launch Dashboard</strong>.
                </p>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-slate-950/50 border border-white/10 text-center text-[11px] text-slate-400 leading-relaxed">
              <span>Checking real email inbox? Real delivery requires Gmail or SMTP configured in <code>.env</code>. Without it, your code is displayed above!</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.5em] text-2xl font-black px-4 py-3 rounded-xl bg-slate-950/80 border border-white/20 text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50"
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp}
                className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
              >
                {isVerifyingOtp ? 'Verifying Code...' : 'Verify & Launch Dashboard'}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Resend OTP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setError(null);
                  }}
                  className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </button>
              </div>

              {/* Dev helper button for local environment */}
              <div className="pt-2 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={handleFetchDevOtp}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
                >
                  [Local Dev Test] Autofill Active OTP
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Top Segmented Tab Switch: [ Sign In ]  [ Create Account ] */}
            <div className="flex p-1.5 rounded-2xl bg-slate-950/70 border border-white/10 mb-6 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                }}
                className={clsx(
                  'flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-200',
                  activeTab === 'signin'
                    ? 'bg-slate-800/90 text-white shadow-md border border-white/10'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setError(null);
                }}
                className={clsx(
                  'flex-1 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all duration-200',
                  activeTab === 'signup'
                    ? 'bg-slate-800/90 text-white shadow-md border border-white/10'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* VIEW 1: SIGN IN                                                    */}
            {/* ------------------------------------------------------------------ */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Mascot / Savings Illustration */}
                  <div className="hidden sm:flex flex-col items-center justify-center shrink-0 w-32 h-32 relative">
                    <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-md">
                      <circle cx="80" cy="80" r="62" fill="#10b981" fillOpacity="0.12" />
                      <path d="M50 145 C50 115, 62 105, 78 102 C82 101, 88 101, 92 102 C108 105, 120 115, 120 145 Z" fill="#ffffff" fillOpacity="0.95" />
                      <path d="M50 145 C50 115, 62 105, 78 102" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M120 145 C120 115, 108 105, 92 102" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      
                      <path d="M80 88 L80 102" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="80" cy="68" r="17" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                      <path d="M66 66 C66 52, 72 48, 80 48 C88 48, 94 52, 94 66 C92 57, 84 55, 80 55 C74 55, 68 59, 66 66 Z" fill="#0f172a" />
                      
                      <path d="M85 110 C72 110, 64 118, 64 130 C64 140, 73 146, 86 146 C99 146, 108 140, 108 130 C108 118, 98 110, 85 110 Z" fill="#10b981" />
                      <path d="M81 108 L89 108" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
                      <text x="86" y="136" fontSize="17" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="system-ui">₹</text>
                      
                      <circle cx="106" cy="114" r="3.5" fill="#34d399" />
                      <circle cx="114" cy="104" r="2.8" fill="#6ee7b7" />
                      <circle cx="110" cy="94" r="2" fill="#a7f3d0" />
                    </svg>
                  </div>

                  {/* Input Fields */}
                  <div className="flex-1 w-full space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                      />
                      <div className="text-right mt-1.5">
                        <Link
                          to="/forgot-password"
                          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glowing Emerald Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* "or" Divider */}
                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-slate-900/80 px-3 text-[11px] text-slate-400 uppercase font-semibold">
                    or
                  </span>
                </div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2.5 border border-slate-200"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Google Sign-In</span>
                </button>

                {/* Fast Demo Mode Link for Reviewers */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      toggleDemoMode(true);
                      navigate('/');
                    }}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Explore with pre-seeded demo records</span>
                  </button>
                </div>
              </form>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* VIEW 2: CREATE ACCOUNT                                             */}
            {/* ------------------------------------------------------------------ */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="flex items-center justify-center gap-2.5 pb-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-emerald-500/20">
                    ₹
                  </div>
                  <span className="font-extrabold text-xl tracking-tight text-white">
                    Paisa<span className="text-emerald-400">Wise</span>
                  </span>
                </div>

                {/* Legal Name Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Legal Name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (min 6 characters)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/60 border border-white/15 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Glowing Emerald Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-300 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account & Receive OTP'}
                </button>

                {/* Terms of Service Checkbox */}
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    id="tos"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/20 bg-slate-950/60 text-emerald-500 focus:ring-emerald-400"
                  />
                  <label htmlFor="tos" className="cursor-pointer hover:text-slate-300">
                    Terms of Service and Privacy Policy
                  </label>
                </div>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
