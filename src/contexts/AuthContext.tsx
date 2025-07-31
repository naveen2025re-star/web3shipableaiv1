import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  github_pat: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  getUserProfile: () => Promise<{ data: UserProfile | null; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Session retrieval error (this is normal on first visit):', error.message);
          // Clear any invalid tokens and localStorage
          await supabase.auth.signOut();
          // Only clear auth-related items, not all localStorage
          localStorage.removeItem('sb-nwalllwwcywinbszzlbm-auth-token');
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.log('Auth initialization error (this is normal on first visit):', err);
        // Clear everything on initialization error
        await supabase.auth.signOut();
        localStorage.removeItem('sb-nwalllwwcywinbszzlbm-auth-token');
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only log important auth events
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('Auth state change:', event, session?.user?.id);
      }
      
      if (event === 'TOKEN_REFRESHED' && !session) {
        console.log('Token refresh failed, clearing session');
        await supabase.auth.signOut();
        localStorage.removeItem('sb-nwalllwwcywinbszzlbm-auth-token');
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('sb-nwalllwwcywinbszzlbm-auth-token');
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event !== 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('sb-nwalllwwcywinbszzlbm-auth-token');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force clear even if signOut fails
      localStorage.removeItem('sb-nwalllwwcywinbszzlbm-auth-token');
      setSession(null);
      setUser(null);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: { message: 'No authenticated user' } };
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id);

      return { error };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { error };
    }
  };

  const getUserProfile = async () => {
    if (!user) {
      return { data: null, error: { message: 'No authenticated user' } };
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateUserProfile,
    getUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}