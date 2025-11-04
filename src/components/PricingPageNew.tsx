import React, { useState, useEffect } from 'react';
import { Home, Check, X, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// --- Stripe Buy Button Data ---
const STRIPE_BUTTON_DATA = {
  monthly: {
    buyButtonId: "buy_btn_1SOeH0Rq1JXLPYBDWqxitwUc",
    publishableKey: "pk_test_51QuwqnRq1JXLPYBDxEWg3Us1FtE5tfm4FAXW7Aw2CHCwY7bvGkIgRIDBBlGWg61ooSB5xAC8bHuhGcUNR9AA5d8J00kRpp5TyC",
  },
  annual: {
    buyButtonId: "buy_btn_1SOeNqRq1JXLPYBDfIO0np8u",
    publishableKey: "pk_test_51QuwqnRq1JXLPYBDxEWg3Us1FtE5tfm4FAXW7Aw2CHCwY7bvGkIgRIDBBlGWg61ooSB5xAC8bHuhGcUNR9AA5d8J00kRpp5TyC",
  },
  free: {
    buyButtonId: "buy_btn_1SOeTgRq1JXLPYBDnXM2ibuR",
    publishableKey: "pk_test_51QuwqnRq1JXLPYBDxEWg3Us1FtE5tfm4FAXW7Aw2CHCwY7bvGkIgRIDBBlGWg61ooSB5xAC8bHuhGcUNR9AA5d8J00kRpp5TyC",
  },
};

// --- Stripe Buy Button Component ---
const StripeBuyButton = ({ buyButtonId, publishableKey, buttonStyle }) => {
  useEffect(() => {
    // Check if the script is already loaded
    if (!document.querySelector('script[src="https://js.stripe.com/v3/buy-button.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/buy-button.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <stripe-buy-button
      buy-button-id={buyButtonId}
      publishable-key={publishableKey}
      style={{ width: '100%' }}
      button-style={buttonStyle}
    />
  );
};

// --- Pricing Data Structure ---

const CORE_FEATURES = [
  { name: 'Practice Exam', free: true, monthly: true, annual: true },
  { name: 'AI Feedback Report', free: true, monthly: true, annual: true },
  { name: 'Writing Tools', free: false, monthly: true, annual: true },
  { name: 'Text Type Templates', free: false, monthly: true, annual: true },
  { name: 'Progress Tracking', free: false, monthly: true, annual: true },
  { name: 'Email Support', free: false, monthly: true, annual: true },
];

const PRO_FEATURES = [
  { name: 'Access to Learning Mode', free: false, monthly: true, annual: true }, // New feature added
  { name: 'Option to write on your prompt (based on Essay type)', free: false, monthly: true, annual: true },
  { name: 'Unlimited AI Coaching & Feedback', free: false, monthly: true, annual: true },
  { name: 'Full Access to All 15+ Templates', free: false, monthly: true, annual: true },
  { name: 'Unlimited Practice Essays & Exams', free: false, monthly: true, annual: true },
  { name: 'Advanced Writing Analysis', free: false, monthly: true, annual: true },
  { name: 'Priority Technical Support', free: false, monthly: true, annual: true },
];

const ALL_FEATURES = [...CORE_FEATURES, ...PRO_FEATURES];

const PLANS = [
  {
    name: 'Free',
    price: 'Free',
    interval: 'Forever',
    description: 'Start your writing journey with essential tools.',
    isPopular: false,
    cta: 'Start Free',
    ctaLink: '/auth',
    priceId: null,
    isFree: true,
  },
  {
    name: 'Pro Monthly',
    price: '$20',
    interval: 'per month',
    description: 'The complete, all-in-one solution for exam prep.',
    isPopular: false,
    cta: 'Start 7-Day Free Trial',
    ctaLink: '/auth',
    priceId: 'price_monthly_id',
    isFree: false,
  },
  {
    name: 'Pro Annual',
    price: '$199',
    interval: 'per year',
    description: 'Best value for long-term, focused exam preparation.',
    isPopular: true,
    cta: 'Start 7-Day Free Trial',
    ctaLink: '/auth',
    priceId: 'price_annual_id',
    isFree: false,
  },
];

// --- Helper Components ---

const FeatureItem = ({ feature, planType }) => {
  const isIncluded = feature[planType];

  // If the feature is not included in the plan, we don't render it at all, as requested.
  if (!isIncluded) {
    return null;
  }

  return (
    <li className="flex items-start gap-3">
      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      <span className="text-gray-300">{feature.name}</span>
    </li>
  );
};

const PricingCard = ({ plan, planType, stripeButtonData }) => {
  const navigate = useNavigate();
  const isAnnual = planType === 'annual';
  const isMonthly = planType === 'monthly';
  const isFree = planType === 'free';
  const isPopular = plan.isPopular;

  // Define the button style based on the plan type to match the original design
  const getButtonStyle = () => {
    // Pro Monthly and Pro Annual buttons have a purple gradient background and shadow
    const popularStyle = `
      background: linear-gradient(to right, #8b5cf6, #a855f7); /* From purple-500 to purple-600 */
      color: #ffffff;
      font-size: 1.125rem; /* text-lg */
      font-weight: 700; /* font-bold */
      padding: 0.75rem 1.5rem; /* py-3 px-6 */
      border-radius: 0.75rem; /* rounded-xl */
      border: none;
      box-shadow: 0 10px 15px -3px rgba(168, 85, 247, 0.5), 0 4px 6px -4px rgba(168, 85, 247, 0.5); /* Custom shadow for popular button */
      transition: all 0.3s ease;
      width: 100%;
      height: 100%;
    `;

    // Free plan button has a white border and transparent background
    const freeStyle = `
      background-color: transparent;
      color: #ffffff;
      font-size: 1.125rem; /* text-lg */
      font-weight: 700; /* font-bold */
      padding: 0.75rem 1.5rem; /* py-3 px-6 */
      border-radius: 0.75rem; /* rounded-xl */
      border: 2px solid #ffffff; /* border-2 border-white */
      box-shadow: none;
      transition: all 0.3s ease;
      width: 100%;
      height: 100%;
    `;

    return isFree ? freeStyle : popularStyle;
  };

  const cardClasses = isPopular
    ? 'relative bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-2 border-purple-500 rounded-3xl p-8 backdrop-blur-sm shadow-2xl transform scale-105 transition-all duration-300'
    : 'relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm';

  // The Stripe Buy Button will handle the actual checkout, but we keep the classes for styling the wrapper
  const ctaClasses = 'w-full'; // Simplified to avoid conflicting styles

  return (
    <div className={cardClasses}>
      {isPopular && (
        <div className="absolute top-0 right-0 -mt-4 -mr-4 px-4 py-1 bg-yellow-500 text-black text-sm font-bold rounded-full shadow-lg transform rotate-3">
          Most Popular
        </div>
      )}
      <div className="pt-0">
        {/* Plan Title */}
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          {plan.name}
        </h2>
        <p className="text-gray-400 text-center mb-6">{plan.description}</p>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-purple-400 mb-1">
            {plan.price}
          </div>
          <p className="text-gray-400 text-lg">{plan.interval}</p>
          {!isFree && (
            <p className="text-gray-300 text-sm font-semibold mt-3">
              First 7 days free • Cancel anytime
            </p>
          )}
          {isAnnual && (
            <p className="text-yellow-400 text-sm font-semibold mt-1">
              Save 17% compared to monthly
            </p>
          )}
        </div>

        {/* Value Justification Section - Added for clarity */}
        {!isFree && (
          <div className="text-center mb-6 pt-4 border-t border-gray-700/50">
            <p className="text-sm font-semibold mb-2 text-gray-400">
              Less than the cost of a single hour of private tutoring
            </p>
            <p className="text-lg font-bold text-yellow-400">
              {`${plan.price}${plan.interval.includes('month') ? '/month' : ''}`} vs $60-$120/hour for a tutor
            </p>
          </div>
        )}

        {/* CTA Button - Replaced with Stripe Buy Button */}
        <div className={ctaClasses}>
          <StripeBuyButton
            buyButtonId={stripeButtonData.buyButtonId}
            publishableKey={stripeButtonData.publishableKey}
            buttonStyle={getButtonStyle()}
          />
        </div>

        {/* Features List */}
        <div className="mt-8 pt-6 border-t border-gray-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
          <ul className="space-y-4">
            {ALL_FEATURES.map((feature, index) => (
              <FeatureItem key={index} feature={feature} planType={planType} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export function PricingPageNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden">
      {/* Back to Home Button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex justify-start">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 border border-white rounded-full transition-all hover:shadow-lg font-medium"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mb-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white">
            Choose Your Path to Selective School Success
          </h1>
          {/* Pinkish-purple underline below the text */}
          <div className="h-1 w-48 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto"></div>
        </div>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Find the perfect plan to boost your child's writing score with personalized AI coaching.
        </p>
      </div>

      {/* Pricing Tiers Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Free Plan */}
          <PricingCard plan={PLANS[0]} planType="free" stripeButtonData={STRIPE_BUTTON_DATA.free} />

          {/* Monthly Plan */}
          <PricingCard plan={PLANS[1]} planType="monthly" stripeButtonData={STRIPE_BUTTON_DATA.monthly} />

          {/* Annual Plan (Most Popular) */}
          <PricingCard plan={PLANS[2]} planType="annual" stripeButtonData={STRIPE_BUTTON_DATA.annual} />
        </div>

        {/* Detailed Feature Comparison Section Removed as requested by user */}
      </div>

      {/* Referral Teaser Section - Updated Design */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex justify-center">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-900 border border-purple-500/50 rounded-3xl p-8 shadow-2xl shadow-purple-900/50">
            <div className="text-center">
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-4xl font-extrabold text-white mb-2">
                Refer a Friend, Get Rewarded
              </h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  As a paying customer, you have the exclusive opportunity to refer friends and earn rewards.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center mb-8">
              <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/30">
                <p className="text-3xl font-bold text-yellow-400">1</p>
                <p className="text-sm text-gray-300 mt-1">Referral = 1 Free Month</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/30">
                <p className="text-3xl font-bold text-yellow-400">2</p>
                <p className="text-sm text-gray-300 mt-1">Referrals = $5 Off for 6 Months</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-800/50 border border-purple-500/30">
                <p className="text-3xl font-bold text-yellow-400">3</p>
                <p className="text-sm text-gray-300 mt-1">Referrals = $10 Off for 6 Months</p>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => navigate('/auth')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
              >
                Sign Up to Start Referring
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Content Grid */}
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Tagline */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg"></div>
                <span className="text-white font-bold text-lg">Writing Mate</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                AI-powered writing coach for NSW Selective School exam preparation. Master essay writing with personalized feedback and guidance.
              </p>
              {/* Social Icons */}
              <div className="flex gap-4 mt-6">
                <a href="https://twitter.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="mailto:support@writingmate.co" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="/" className="text-gray-400 hover:text-purple-400 transition-colors">Home</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-purple-400 transition-colors">Pricing</a></li>
                <li><a href="/auth" className="text-gray-400 hover:text-purple-400 transition-colors">Sign In</a></li>
                <li><a href="/auth" className="text-gray-400 hover:text-purple-400 transition-colors">Sign Up</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="/blog" className="text-gray-400 hover:text-purple-400 transition-colors">Blog</a></li>
                <li><a href="/faq" className="text-gray-400 hover:text-purple-400 transition-colors">FAQ</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-purple-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="md:col-span-1">
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-600 border-t border-gray-800 pt-8">
            <p>&copy; {new Date().getFullYear()} Writing Mate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
