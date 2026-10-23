import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { supabaseApi } from '@/lib/supabase/api';
import { Profile } from '@/types';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  toggleDemoMode: (enabled?: boolean) => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'demo-user-1234',
  app_metadata: {},
  user_metadata: { full_name: 'Aditya Sharma' },
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
  email: 'aditya.sharma@example.in',
  role: 'authenticated',
  updated_at: '2026-10-24T00:00:00Z',
} as User;

const DEMO_PROFILE: Profile = {
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
  
  // Default to demo mode if Supabase credentials are not yet configured in .env
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('paisawise_demo_mode');
    if (saved !== null) return saved === 'true';
    return !isSupabaseConfigured;
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
    if (!isSupabaseConfigured || isDemoMode) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setIsLoading(false);
      return;
    }

    // Initialize Supabase Auth listener
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
  }, [isDemoMode]);

  const toggleDemoMode = (enabled?: boolean) => {
    const nextState = enabled !== undefined ? enabled : !isDemoMode;
    setIsDemoMode(nextState);
    localStorage.setItem('paisawise_demo_mode', String(nextState));
    if (nextState) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
    } else if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setSession(session);
        if (session?.user) loadUserProfile(session.user.id);
        else setProfile(null);
      });
    } else {
      setUser(null);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      // In demo mode, instantly log in with realistic demo user
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      const customDemoUser = { ...DEMO_USER, email, user_metadata: { full_name: fullName } };
      setUser(customDemoUser);
      setProfile({ ...DEMO_PROFILE, full_name: fullName });
      return { error: null };
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

  const signOut = async () => {
    if (isSupabaseConfigured && !isDemoMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured || isDemoMode) {
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
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
        signOut,
        resetPassword,
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
