// File: src/lib/referral.ts

import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  referral_code: string;
  referral_count: number;
  referred_by: string | null;
  // ... other profile fields
}

/**
 * Fetches the current user's profile, including referral information.
 * @returns The user profile or null if not found.
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id, 
      email, 
      referral_code, 
      referral_count, 
      referred_by
    `)
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as UserProfile | null;
}

/**
 * Fetches the number of successful referrals for a given user ID.
 * @param userId The ID of the user.
 * @returns The referral count, or 0 if an error occurs.
 */
export async function fetchReferralCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('referral_count')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching referral count:', error);
    return 0;
  }

  return data?.referral_count || 0;
}

/**
 * Generates the full referral link for the user.
 * @param referralCode The user's unique referral code.
 * @returns The full referral URL.
 */
export function generateReferralLink(referralCode: string): string {
  // Assuming the base URL is the current window location, or a known environment variable
  // For simplicity, we'll use a placeholder and assume the app handles the routing
  const baseUrl = window.location.origin;
  return `${baseUrl}/?ref=${referralCode}`;
}

/**
 * Determines the reward tier based on the number of referrals.
 * @param count The number of successful referrals.
 * @returns A string describing the reward.
 * 
 * FIX: Updated to match the reward tiers from the provided image (1, 2, 3 referrals).
 */
export function getRewardTier(count: number): { tier: number, reward: string, description: string } {
  if (count >= 3) {
    return { 
      tier: 3, 
      reward: '$10 Off for 6 Months', 
      description: 'You have unlocked the highest reward tier!' 
    };
  } else if (count >= 2) {
    return { 
      tier: 2, 
      reward: '$5 Off for 6 Months', 
      description: 'Keep going! One more referral to the top tier.' 
    };
  } else if (count >= 1) {
    return { 
      tier: 1, 
      reward: '1 Free Month', 
      description: 'Refer your first friend to unlock your first reward.' 
    };
  } else {
    return { 
      tier: 0, 
      reward: 'No Reward Yet', 
      description: 'Refer your first friend to unlock your first reward.' 
    };
  }
}