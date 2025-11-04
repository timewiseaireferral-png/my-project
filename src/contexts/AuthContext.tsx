// File: src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Define the AuthContext interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  emailVerified: boolean;
  paymentCompleted: boolean;
  isPaidUser: boolean;
  authSignIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  authSignUp: (email: string, password: string, referredBy?: string) => Promise<{ data: any; error: any }>;
  authSignOut: () => Promise<void>;
  forceRefreshVerification: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // NOTE: The referred_by field is handled via the auth.users trigger in the database.
  const ensureUserProfile = async (user: User) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('User profile does not exist, will be created by trigger.');
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const isPaymentCompleted = (profile: any) => {
    const hasVerifiedPayment = profile?.payment_verified === true;
    const hasVerifiedStatus = profile?.payment_status === 'verified';
    const hasActiveSubscription = profile?.subscription_status === 'active';
    const hasManualOverride = profile?.manual_override === true;
    const hasTempAccess = profile?.temp_access_until && new Date(profile.temp_access_until) > new Date();
    return hasVerifiedPayment || hasVerifiedStatus || hasActiveSubscription || hasManualOverride || hasTempAccess;
  };

  const checkUserAndStatus = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      setUser(supabaseUser);

      if (supabaseUser) {
        await ensureUserProfile(supabaseUser);

        let isEmailVerified = !!supabaseUser.email_confirmed_at;
        setEmailVerified(isEmailVerified);

        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select(`payment_verified, payment_status, manual_override, subscription_status, temp_access_until`)
          .eq("id", supabaseUser.id)
          .single();

        if (profile) {
          const completed = isPaymentCompleted(profile);
          setPaymentCompleted(completed);
        } else {
          setPaymentCompleted(false);
        }
      } else {
        setEmailVerified(false);
        setPaymentCompleted(false);
      }
    } catch (error) {
      console.error('Error in checkUserAndStatus:', error);
      setUser(null);
      setEmailVerified(false);
      setPaymentCompleted(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUserAndStatus();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserAndStatus();
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkUserAndStatus]);

  const forceRefreshVerification = useCallback(() => {
    checkUserAndStatus();
  }, [checkUserAndStatus]);

  const authSignIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const authSignUp = async (email: string, password: string, referredBy?: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          referred_by: referredBy || null,
        },
      },
    });
  };

  const authSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmailVerified(false);
    setPaymentCompleted(false);
    localStorage.clear();
  };

  const value: AuthContextType = {
    user,
    loading,
    emailVerified,
    paymentCompleted,
    isPaidUser: paymentCompleted,
    authSignIn,
    authSignUp,
    authSignOut,
    forceRefreshVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};