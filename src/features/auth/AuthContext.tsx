import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { supabaseApi } from '@/lib/supabase/api';
import { Profile } from '@/types';
import { User, Session } from '@supabase/supabase-js';

export function getAuthToken(): string | null {
  return localStorage.getItem('paisawise_jwt_token');
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  toggleDemoMode: (enabled?: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; requiresVerification?: boolean; email?: string }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null; requiresVerification?: boolean; email?: string }>;
  verifyOtp: (email: string, otpCode: string, purpose?: string) => Promise<{ error: Error | null }>;
  requestOtp: (email: string, purpose?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string, otpCode?: string, email?: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USER: User = {
  id: 'demo-user-1234',
  app_metadata: {},
  user_metadata: { full_name: 'Aditya Sharma' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  email: 'aditya.sharma@example.in',
  role: 'authenticated',
  updated_at: '2026-10-24T00:00:00Z',
} as User;

export const DEMO_PROFILE: Profile = {
  id: 'demo-user-1234',
  full_name: 'Aditya Sharma',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  theme: 'light',
  monthly_income_target: 120000,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-10-24T00:00:00Z',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return sessionStorage.getItem('paisawise_demo_session') === 'true';
  });

  const loadUserProfile = async (userId: string) => {
    try {
      const p = await supabaseApi.getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    // 1. Demo mode check
    if (isDemoMode) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setIsLoading(false);
      return;
    }

    // 2. Supabase configured check
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user.id);
        }
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    // 3. Local Backend API mode with JWT session persistence
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(async (res) => {
        if (!res.ok) {
          localStorage.removeItem('paisawise_jwt_token');
          setUser(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }
        const data = await res.json();
        const localUser: User = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata || {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: data.user.created_at || new Date().toISOString(),
          role: 'authenticated'
        } as User;

        setUser(localUser);
        setProfile(data.profile);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to verify local auth token:', err);
        localStorage.removeItem('paisawise_jwt_token');
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      });
  }, [isDemoMode]);

  const toggleDemoMode = (enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !isDemoMode;
    setIsDemoMode(nextState);
    if (nextState) {
      sessionStorage.setItem('paisawise_demo_session', 'true');
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
    } else {
      sessionStorage.removeItem('paisawise_demo_session');
      localStorage.removeItem('paisawise_jwt_token');
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.status === 403 && data.requiresVerification) {
          return { error: null, requiresVerification: true, email: data.email };
        }

        if (!res.ok) {
          return { error: new Error(data.error || 'Login failed') };
        }

        localStorage.setItem('paisawise_jwt_token', data.token);
        const localUser: User = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata || {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated'
        } as User;

        setUser(localUser);
        setProfile(data.profile);
        return { error: null };
      } catch (err: any) {
        return { error: new Error(err.message || 'Network error connecting to local server') };
      }
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName })
        });
        const data = await res.json();

        if (!res.ok) {
          return { error: new Error(data.error || 'Registration failed') };
        }

        return { 
          error: null, 
          requiresVerification: true, 
          email: data.email 
        };
      } catch (err: any) {
        return { error: new Error(err.message || 'Network error connecting to local server') };
      }
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    return { error: error as Error | null };
  };

  const verifyOtp = async (email: string, otpCode: string, purpose: string = 'signup_verification') => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode, purpose })
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Verification failed') };
      }

      if (data.token) {
        localStorage.setItem('paisawise_jwt_token', data.token);
        const localUser: User = {
          id: data.user.id,
          email: data.user.email,
          user_metadata: data.user.user_metadata || {},
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: 'authenticated'
        } as User;

        setUser(localUser);
        setProfile(data.profile);
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Network error during verification') };
    }
  };

  const requestOtp = async (email: string, purpose: string = 'signup_verification') => {
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose })
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: new Error(data.error || 'Failed to request new code') };
      }

      return { error: null };
    } catch (err: any) {
      return { error: new Error(err.message || 'Network error requesting OTP') };
    }
  };

  const signOut = async () => {
    sessionStorage.removeItem('paisawise_demo_session');
    localStorage.removeItem('paisawise_jwt_token');
    setIsDemoMode(false);
    
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    } else {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout network error
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: new Error(data.error || 'Failed to request recovery code') };
        }
        return { error: null };
      } catch (err: any) {
        return { error: new Error(err.message || 'Network error during password reset request') };
      }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string, otpCode?: string, email?: string) => {
    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otpCode, newPassword })
        });
        const data = await res.json();
        if (!res.ok) {
          return { error: new Error(data.error || 'Failed to reset password') };
        }
        return { error: null };
      } catch (err: any) {
        return { error: new Error(err.message || 'Network error during password reset') };
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isDemoMode,
        toggleDemoMode,
        signIn,
        signUp,
        verifyOtp,
        requestOtp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
