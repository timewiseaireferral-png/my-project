// File: src/components/ReferralSystem.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserProfile, generateReferralLink } from '../lib/referral';
import { Check, Copy, Loader2, Handshake } from 'lucide-react';

// Define the rewards structure based on the image
const REWARDS = [
  { id: 1, title: '1', reward: 'Referral = 1 Free Month' },
  { id: 2, title: '2', reward: 'Referrals = $5 Off for 6 Months' },
  { id: 3, title: '3', reward: 'Referrals = $10 Off for 6 Months' },
];

// Re-using the color palette from PricingPage.tsx
const COLORS = {
  NAVY_BACKGROUND: '#0F1419',
  CARD_BACKGROUND: '#1E293B',
  PURPLE_START: '#8B5CF6', // Indigo-500
  PURPLE_END: '#A855F7', // Violet-500
  BLUE: '#3B82F6', // Blue-500
  GREEN_CHECK: '#10B981', // Emerald-500
  LIGHT_GRAY: '#D1D5DB', // Gray-300
  WHITE: '#FFFFFF',
  YELLOW_GOLD: '#FCD34D', // Amber-300
};

// Custom Card component for the rewards
const RewardCard: React.FC<{ title: string, reward: string, isAchieved: boolean }> = ({ title, reward, isAchieved }) => {
  return (
    <div 
      className={`p-6 rounded-xl text-center transition-all duration-300 ${isAchieved ? 'ring-2 ring-offset-2' : 'ring-1 ring-offset-1'}`}
      style={{ 
        backgroundColor: COLORS.CARD_BACKGROUND,
        borderColor: isAchieved ? COLORS.GREEN_CHECK : COLORS.CARD_BACKGROUND,
        ringColor: isAchieved ? COLORS.GREEN_CHECK : COLORS.CARD_BACKGROUND,
        ringOffsetColor: COLORS.NAVY_BACKGROUND,
      }}
    >
      <div 
        className="text-4xl font-extrabold mb-2 mx-auto w-12 h-12 flex items-center justify-center rounded-full"
        style={{ 
          color: COLORS.WHITE,
          backgroundImage: isAchieved 
            ? `linear-gradient(to right, ${COLORS.GREEN_CHECK}, ${COLORS.BLUE})`
            : `linear-gradient(to right, ${COLORS.PURPLE_START}, ${COLORS.PURPLE_END})`,
        }}
      >
        {isAchieved ? <Check className="w-6 h-6" /> : title}
      </div>
      <p className="text-sm font-medium" style={{ color: COLORS.LIGHT_GRAY }}>
        {reward}
      </p>
    </div>
  );
};

export const ReferralSystem: React.FC = () => {
  const { user, paymentCompleted, loading: authLoading } = useAuth();
  const [referralCount, setReferralCount] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  const loadReferralData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const profile = await fetchUserProfile(user.id);
    
    if (profile) {
      setReferralCount(profile.referral_count);
      setReferralCode(profile.referral_code);
    } else {
      setReferralCount(0);
      setReferralCode(user.id); // Fallback to user ID as code
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadReferralData();
    }
  }, [authLoading, loadReferralData]);

  const handleCopy = () => {
    if (referralCode) {
      const link = generateReferralLink(referralCode);
      navigator.clipboard.writeText(link).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(err => {
        console.error('Could not copy text: ', err);
        // Fallback for older browsers
        const el = document.createElement('textarea');
        el.value = link;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  // If the user is not a paid customer, show the sign-up prompt
  if (!paymentCompleted) {
    return (
      <div 
        className="max-w-4xl mx-auto p-10 rounded-2xl text-center mt-16"
        style={{ backgroundColor: COLORS.CARD_BACKGROUND }}
      >
        <Handshake className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.YELLOW_GOLD }} />
        <h2 className="text-3xl font-bold mb-2" style={{ color: COLORS.WHITE }}>
          Refer a Friend, Get Rewarded
        </h2>
        <p className="text-lg mb-8" style={{ color: COLORS.LIGHT_GRAY }}>
          As a paying customer, you have the exclusive opportunity to refer friends and earn rewards.
        </p>
        
        <div className="grid grid-cols-3 gap-4 mb-10">
          {REWARDS.map(reward => (
            <RewardCard key={reward.id} title={reward.title} reward={reward.reward} isAchieved={false} />
          ))}
        </div>

        <button
          onClick={() => { /* Logic to navigate to sign up or pricing page */ }}
          className="px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300"
          style={{ 
            color: COLORS.WHITE,
            backgroundImage: `linear-gradient(to right, ${COLORS.PURPLE_START}, ${COLORS.PURPLE_END})`,
            boxShadow: `0 4px 15px rgba(139, 92, 246, 0.4)`,
          }}
        >
          Sign Up to Start Referring
        </button>
      </div>
    );
  }

  // If the user is a paid customer, show the referral link and count
  return (
    <div 
      className="max-w-4xl mx-auto p-10 rounded-2xl text-center mt-16"
      style={{ backgroundColor: COLORS.CARD_BACKGROUND }}
    >
      <Handshake className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.YELLOW_GOLD }} />
      <h2 className="text-3xl font-bold mb-2" style={{ color: COLORS.WHITE }}>
        Your Referral System
      </h2>
      <p className="text-lg mb-8" style={{ color: COLORS.LIGHT_GRAY }}>
        Share your unique link to start earning rewards. You currently have 
        <span className="font-bold" style={{ color: COLORS.YELLOW_GOLD }}> {referralCount === null ? '...' : referralCount} </span> 
        successful referrals.
      </p>

      {isLoading || referralCount === null ? (
        <div className="flex justify-center items-center h-20">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: COLORS.LIGHT_GRAY }} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-10">
            {REWARDS.map((reward, index) => (
              <RewardCard 
                key={reward.id} 
                title={reward.title} 
                reward={reward.reward} 
                isAchieved={referralCount >= index + 1} 
              />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            <div 
              className="flex-grow p-3 rounded-lg text-left overflow-hidden whitespace-nowrap text-ellipsis"
              style={{ 
                backgroundColor: COLORS.NAVY_BACKGROUND, 
                color: COLORS.LIGHT_GRAY,
                border: `1px solid ${COLORS.PURPLE_START}`
              }}
            >
              {generateReferralLink(referralCode || '')}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 w-full sm:w-auto"
              style={{ 
                color: COLORS.WHITE,
                backgroundImage: `linear-gradient(to right, ${isCopied ? COLORS.GREEN_CHECK : COLORS.PURPLE_START}, ${isCopied ? COLORS.GREEN_CHECK : COLORS.PURPLE_END})`,
                boxShadow: `0 4px 15px rgba(139, 92, 246, 0.4)`,
              }}
            >
              {isCopied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};