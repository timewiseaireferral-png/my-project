import React, { useState, useEffect } from 'react';
import { Home, Check, X, Twitter, Linkedin, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// --- Pricing Data Structure ---

const CORE_FEATURES = [
  { name: 'Basic Writing Tools', free: true, monthly: true, annual: true },
  { name: 'Basic Text Type Templates', free: true, monthly: true, annual: true },
  { name: 'Basic Progress Tracking', free: true, monthly: true, annual: true },
  { name: 'Email Support', free: true, monthly: true, annual: true },
];

const PRO_FEATURES = [
  { name: 'Unlimited AI Coaching & Feedback', free: false, monthly: true, annual: true },
  { name: 'Full Access to All 15+ Templates', free: false, monthly: true, annual: true },
  { name: 'Unlimited Practice Essays & Exams', free: false, monthly: true, annual: true },
  { name: 'Advanced Writing Analysis', free: false, monthly: true, annual: true },
  { name: 'Priority Technical Support', free: false, monthly: true, annual: true },
];

const ALL_FEATURES = [...CORE_FEATURES, ...PRO_FEATURES];

const PLANS = [
  {
    name: 'Basic',
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
    priceId: 'price_monthly_id', // Placeholder - replace with actual Stripe Price ID
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
    priceId: 'price_annual_id', // Placeholder - replace with actual Stripe Price ID
    isFree: false,
  },
];

// --- Helper Components ---

const FeatureItem = ({ feature, planType }) => {
  const isIncluded = feature[planType];
  return (
    <li className="flex items-start gap-3">
      {isIncluded ? (
        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      ) : (
        <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
      )}
      <span className="text-gray-300">{feature.name}</span>
    </li>
  );
};

const PricingCard = ({ plan, planType }) => {
  const navigate = useNavigate();
  const isAnnual = planType === 'annual';
  const isMonthly = planType === 'monthly';
  const isFree = planType === 'free';
  const isPopular = plan.isPopular;

  const cardClasses = isPopular
    ? 'relative bg-gradient-to-br from-blue-600/30 to-purple-600/30 border-2 border-purple-500 rounded-3xl p-8 backdrop-blur-sm shadow-2xl transform scale-105 transition-all duration-300'
    : 'relative bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-purple-500/30 rounded-3xl p-8 backdrop-blur-sm';

  const ctaClasses = isPopular
    ? 'w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95'
    : 'w-full bg-transparent border-2 border-white text-gray-300 font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 hover:bg-purple-600 hover:text-white hover:border-purple-600';

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
              {plan.price}{plan.interval.includes('month') ? '/month' : ''} vs $60-$120/hour for a tutor
            </p>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={() => navigate(plan.ctaLink)}
          className={ctaClasses}
        >
          {plan.cta}
        </button>

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
          <PricingCard plan={PLANS[0]} planType="free" />

          {/* Monthly Plan */}
          <PricingCard plan={PLANS[1]} planType="monthly" />

          {/* Annual Plan (Most Popular) */}
          <PricingCard plan={PLANS[2]} planType="annual" />
        </div>

        {/* Value Comparison Table (Optional: for a future phase) */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Detailed Feature Comparison</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-8">See exactly what you get with each plan.</p>

          {/* Feature Table Placeholder - Implementing a full comparison table is complex and can be a future task. */}
          {/* For now, the cards show the comparison clearly. We will use a simple CTA to a full comparison if needed. */}
          <button
            onClick={() => navigate('/features')} // Assuming a features page exists
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
          >
            See All Features in Detail
          </button>
        </div>
      </div>

      {/* Referral Teaser Section - Improved */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex justify-center">
        <div className="max-w-lg w-full">
        <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm animate-fadeIn">
          {/* Centered Trophy Icon */}
          <div className="text-center mb-4">
            <div className="text-5xl">🏆</div>
          </div>
          
          {/* Centered Heading */}
          <h3 className="text-purple-400 font-bold text-lg text-center mb-4">
            🎁 Refer & Earn Rewards
          </h3>
          
          {/* Improved Centered Subtitle with Better Alignment */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm leading-relaxed mb-3">
              Share Writing Mate with friends after signup—earn FREE months!
            </p>
            
            {/* Referral Tiers - Centered Multi-line List */}
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-center items-center gap-2">
                <span className="text-yellow-400 font-semibold">1 Referral</span>
                <span className="text-gray-500">=</span>
                <span>1 Free Month</span>
              </div>
              <div className="flex justify-center items-center gap-2">
                <span className="text-yellow-400 font-semibold">2 Referrals</span>
                <span className="text-gray-500">=</span>
                <span>$5 Off for 6 Months</span>
              </div>
              <div className="flex justify-center items-center gap-2">
                <span className="text-yellow-400 font-semibold">3 Referrals</span>
                <span className="text-gray-500">=</span>
                <span>$10 Off for 6 Months</span>
              </div>
            </div>
          </div>

          {/* CTA Button - Centered */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/auth')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all text-sm"
            >
              Sign Up to Refer & Earn
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
                <a href="https://discord.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com" className="text-gray-500 hover:text-purple-400 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">PRODUCT</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="text-gray-500 hover:text-purple-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/writing" className="text-gray-500 hover:text-purple-400 transition-colors">
                    Start Writing
                  </a>
                </li>
              </ul>
            </div>

            {/* Support Column */}
            <div>
              <h4 className="text-white font-semibold mb-4">SUPPORT</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/faq" className="text-gray-500 hover:text-purple-400 transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="mailto:support@writingmate.com" className="text-gray-500 hover:text-purple-400 transition-colors flex items-center gap-2">
                    <span>Contact Support</span>
                  </a>
                </li>
                <li>
                  <a href="#help" className="text-gray-500 hover:text-purple-400 transition-colors">
                    Help Center
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column (Only About Us ) */}
            <div>
              <h4 className="text-white font-semibold mb-4">COMPANY</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-500 hover:text-purple-400 transition-colors">
                    About Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Horizontal Links */}
          <div className="border-t border-gray-800 pt-8 mb-8">
            <div className="flex flex-wrap gap-4 justify-center text-sm">
              <a href="/privacy" className="text-gray-500 hover:text-purple-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/terms" className="text-gray-500 hover:text-purple-400 transition-colors">
                Terms of Service
              </a>
              <span className="text-gray-700">•</span>
              <a href="/cookies" className="text-gray-500 hover:text-purple-400 transition-colors">
                Cookie Policy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/accessibility" className="text-gray-500 hover:text-purple-400 transition-colors">
                Accessibility
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-600 text-sm">
            © 2025 Writing Mate. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-t border-purple-500/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-8 text-center">
            <p className="text-gray-300 text-lg mb-6">
              Ready to improve your writing? Start your NSW Selective School exam preparation today.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPageNew;