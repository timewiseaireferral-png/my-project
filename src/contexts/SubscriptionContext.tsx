import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export type PlanType = 'Free' | 'Pro';

export interface SubscriptionStatus {
  plan: PlanType;
  isActive: boolean;
  isLoading: boolean;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  hasAccess: (feature: string) => boolean;
  showUpgradeModal: () => void;
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

const SubscriptionContext = createContext<SubscriptionStatus | undefined>(undefined);

// Define which features are available for each plan
const FREE_FEATURES = [
  'practice_exam',
  'ai_feedback_report'
];

const PRO_FEATURES = [
  'practice_exam',
  'ai_feedback_report',
  'writing_tools',
  'text_type_templates',
  'progress_tracking',
  'email_support',
  'learning_mode',
  'custom_prompts',
  'unlimited_ai_coaching',
  'full_templates',
  'unlimited_practice',
  'advanced_analysis',
  'priority_support'
];

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<PlanType>('Free');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState('free');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!user) {
        console.log('SubscriptionContext: No user, setting to Free plan');
        setPlan('Free');
        setIsActive(false);
        setIsLoading(false);
        return;
      }

      try {
        console.log('SubscriptionContext: Fetching subscription status for user:', user.id);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('subscription_status, subscription_plan, current_period_end, payment_verified, manual_override')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('SubscriptionContext: Error fetching subscription:', error);
          setPlan('Free');
          setIsActive(false);
        } else if (data) {
          console.log('SubscriptionContext: Subscription data:', data);

          const subStatus = data.subscription_status || 'free';
          const periodEnd = data.current_period_end;
          const isVerified = data.payment_verified || false;
          const hasOverride = data.manual_override || false;

          setSubscriptionStatus(subStatus);
          setCurrentPeriodEnd(periodEnd);

          // Determine if user has active Pro access
          let hasProAccess = false;

          // Check manual override first
          if (hasOverride) {
            hasProAccess = true;
            console.log('SubscriptionContext: Manual override active');
          }
          // Check if subscription is active or trialing
          else if (subStatus === 'active' || subStatus === 'trialing') {
            // Check if period end is in the future
            if (periodEnd) {
              const periodEndDate = new Date(periodEnd);
              const now = new Date();
              if (periodEndDate > now) {
                hasProAccess = true;
                console.log('SubscriptionContext: Valid subscription period');
              } else {
                console.log('SubscriptionContext: Subscription expired');
              }
            } else if (subStatus === 'trialing') {
              // If trialing and no end date, allow access
              hasProAccess = true;
              console.log('SubscriptionContext: Trial period active');
            }
          }

          // Also check payment_verified as fallback
          if (!hasProAccess && isVerified) {
            hasProAccess = true;
            console.log('SubscriptionContext: Payment verified, granting access');
          }

          setPlan(hasProAccess ? 'Pro' : 'Free');
          setIsActive(hasProAccess);

          console.log(`SubscriptionContext: Final status - Plan: ${hasProAccess ? 'Pro' : 'Free'}, Active: ${hasProAccess}`);
        }
      } catch (err) {
        console.error('SubscriptionContext: Exception fetching subscription:', err);
        setPlan('Free');
        setIsActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();

    // Set up real-time subscription to user_profiles changes
    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user?.id}`
        },
        (payload) => {
          console.log('SubscriptionContext: Real-time update received:', payload);
          fetchSubscriptionStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const hasAccess = (feature: string): boolean => {
    // Free plan users only have access to free features
    if (plan === 'Free') {
      return FREE_FEATURES.includes(feature);
    }

    // Pro plan users have access to all features
    return PRO_FEATURES.includes(feature);
  };

  const showUpgradeModal = () => {
    setShowUpgrade(true);
  };

  const value: SubscriptionStatus = {
    plan,
    isActive,
    isLoading,
    subscriptionStatus,
    currentPeriodEnd,
    hasAccess,
    showUpgradeModal
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionStatus => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
