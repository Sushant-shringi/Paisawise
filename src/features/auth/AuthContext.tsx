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
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
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
  
  // Always default to false so user is presented with the Login / Sign-up page first!
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
    // If user explicitly activated demo mode in this session
    if (isDemoMode) {
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Supabase is not configured and demo mode was not activated: require login!
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // Check existing Supabase session
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
    if (nextState) {
      sessionStorage.setItem('paisawise_demo_session', 'true');
      setUser(DEMO_USER);
      setProfile(DEMO_PROFILE);
    } else {
      sessionStorage.removeItem('paisawise_demo_session');
      if (isSupabaseConfigured) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ?? null);
          setSession(session);
          if (session?.user) loadUserProfile(session.user.id);
          else setProfile(null);
        });
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Offline / Local verification: accept valid email format & password >= 6 chars
      if (password.length < 6) {
        return { error: new Error('Password must be at least 6 characters') };
      }
      const customUser = {
        ...DEMO_USER,
        id: `user-${Date.now()}`,
        email,
        user_metadata: { full_name: email.split('@')[0] }
      };
      setUser(customUser);
      setProfile({
        ...DEMO_PROFILE,
        id: customUser.id,
        full_name: email.split('@')[0]
      });
      sessionStorage.setItem('paisawise_logged_in', 'true');
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured) {
      const customUser = {
        ...DEMO_USER,
        id: `user-${Date.now()}`,
        email,
        user_metadata: { full_name: fullName }
      };
      setUser(customUser);
      setProfile({
        ...DEMO_PROFILE,
        id: customUser.id,
        full_name: fullName
      });
      sessionStorage.setItem('paisawise_logged_in', 'true');
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
    sessionStorage.removeItem('paisawise_demo_session');
    sessionStorage.removeItem('paisawise_logged_in');
    setIsDemoMode(false);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured) {
      // Simulate successful password reset email dispatch
      return { error: null };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured) {
      return { error: null };
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
