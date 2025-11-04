import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link2, Trophy, Copy, CheckCircle, Gift } from 'lucide-react';

// --- Custom Gradient Text Component for the Title (Simulated with Tailwind) ---
const GradientText: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <h1 className={`text-4xl sm:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#7C3AED] to-[#EC4899] ${className}`}>
    {children}
  </h1>
);

interface UserProfile {
  id: string;
  email: string;
  paid_referrals_count: number;
  // Add other necessary fields
}

// --- Referral Card Component for Reusability ---
interface ReferralCardProps {
  tier: { count: number, reward: string, description: string };
  currentCount: number;
}

const ReferralCard: React.FC<ReferralCardProps> = ({ tier, currentCount }) => {
  const isAchieved = currentCount >= tier.count;
  const isNext = !isAchieved && currentCount < tier.count && (currentCount < (tier.count - 1) || tier.count === 1);
  const isPast = currentCount > tier.count;

  // Gold/yellow accent border for all cards as per brief
  const accentClass = 'border-yellow-500/50 shadow-lg shadow-yellow-500/10';
  
  // Apply glassmorphism effect: subtle dark background, slight border, backdrop blur
  const baseClass = `p-6 rounded-xl transition-all duration-300 backdrop-blur-sm bg-slate-800/70 border border-yellow-500/20 ${accentClass} hover:border-yellow-500/70`;

  // Determine the 'more to go' text
  const moreToGo = tier.count - currentCount;
  const statusText = isAchieved ? 'Reward Claimed!' : isPast ? 'Reward Achieved!' : `${moreToGo} more to go`;
  const statusColor = isAchieved || isPast ? 'text-green-400' : 'text-gray-400';

  return (
    <div className={baseClass}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl font-bold text-white">
          {tier.count} {tier.count === 1 ? 'Referral' : 'Referrals'}
        </span>
        <Gift className={`w-8 h-8 ${isAchieved || isPast ? 'text-yellow-400' : 'text-purple-400'}`} />
      </div>
      
      {/* Reward amount in bright purple/blue gradient */}
      <p className="text-2xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
        {tier.reward}
      </p>
      
      <p className="text-gray-400 text-sm mb-4">{tier.description}</p>
      
      <div className="mt-4 pt-4 border-t border-slate-700/50">
        <span className={`text-sm font-medium ${statusColor}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
};


const ReferralPage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // The base URL for the referral link
  const referralBaseUrl = 'https://writingmate.co/signup'; 
  const referralLink = user ? `${referralBaseUrl}?ref=${user.id}` : 'Loading...';

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, paid_referrals_count')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data as UserProfile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tiers adjusted to 3 Referrals for the final tier
  const tiers = [
    { count: 1, reward: '1 Free Month', description: 'After your first paid referral.' },
    { count: 2, reward: '$5 Off for 3 Months', description: 'After your second paid referral.' },
    { count: 3, reward: '$10 Off for 5 Months', description: 'After your third paid referral.' }, // Changed from 5 to 3 referrals
  ];

  const currentCount = profile?.paid_referrals_count || 0;

  if (loading) {
    // Use the dark theme loading style
    return <div className="p-8 text-center text-gray-400 bg-[#0F1419] min-h-screen">Loading referral details...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-red-400 bg-[#0F1419] min-h-screen">Please sign in to view your referral status.</div>;
  }

  return (
    // Overall Layout: Dark navy blue background
    <div className="min-h-screen bg-[#0F1419] text-white p-4 sm:p-8">
      <div className="container mx-auto max-w-4xl">
        
        {/* Hero Section */}
        <header className="text-center py-10">
          <GradientText>Refer & Earn Rewards</GradientText>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Share your unique link with friends. When they sign up and make their first payment, you earn rewards!
          </p>
        </header>

        {/* Referral Link Section */}
        <div className="bg-slate-900/80 shadow-2xl rounded-xl p-6 mb-10 border border-purple-500/30 backdrop-blur-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-400">
            <Link2 className="w-5 h-5 mr-2" /> Your Unique Referral Link
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-grow p-4 border border-slate-700 rounded-lg bg-slate-800 text-gray-200 text-sm truncate focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <button
              onClick={handleCopy}
              className="flex-shrink-0 px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-medium rounded-lg hover:from-[#6A33C9] hover:to-[#D9418E] transition duration-300 ease-in-out flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 text-gray-100 flex items-center">
            <Trophy className="w-6 h-6 mr-2 text-yellow-400" /> Your Progress
          </h2>
          <div className="text-xl font-medium mb-8 text-gray-300">
            Paid Referrals: <span className="text-purple-400 font-extrabold">{currentCount}</span>
          </div>
          
          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <ReferralCard key={tier.count} tier={tier} currentCount={currentCount} />
            ))}
          </div>
        </div>

        {/* How it Works Section */}
        <div className="pt-6 border-t border-slate-800">
          <h2 className="text-2xl font-bold mb-6 text-gray-100">How it Works</h2>
          <ol className="space-y-4 text-gray-300 list-decimal list-inside text-lg">
            <li>Share your unique referral link with a friend, family member, or colleague.</li>
            <li>They sign up for WritingMate using your link.</li>
            <li>They subscribe to a paid plan.</li>
            <li>Your referral count increases, and you automatically receive your reward based on the tiers above!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;