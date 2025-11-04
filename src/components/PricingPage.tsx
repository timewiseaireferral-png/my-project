import React, { useState, useEffect } from 'react';
import { Check, Home } from 'lucide-react'; // Only keep Check and Home
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { products } from '../stripe-config'; // Assuming products is still needed for data

// Define the colors and features based on the user's guidance
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

// Streamlined and outcome-focused feature list
const FEATURE_LIST = [
  "Unlimited AI Coaching & Feedback on all essay types",
  "Full Access to All 15+ Text Type Templates",
  "Unlimited Practice Essays & Exam Simulations",
  "Advanced Writing Analysis (Style, Structure, Rubric Alignment)",
  "Personalized Progress Tracking & Analytics",
  "Priority Technical Support",
];


export function PricingPage() {
  const { user, emailVerified, paymentCompleted } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Simplified loading logic, assuming AuthContext handles the heavy lifting
  useEffect(() => {
    window.scrollTo(0, 0);
    // Check if AuthContext has finished loading its essential states
    if (typeof emailVerified !== 'undefined' && typeof paymentCompleted !== 'undefined') {
      setIsLoading(false);
    }
  }, [emailVerified, paymentCompleted]);

  // --- Main Component Render ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.NAVY_BACKGROUND }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading pricing information...</p>
        </div>
      </div>
    );
  }

  // Use the first product for data, as per the original component logic
  // NOTE: We hardcode the price to $20 as requested, regardless of 'products' data
  const product = products[0] || { 
    id: 'default', 
    name: 'Essential Plan', 
    description: 'Complete writing preparation package', 
    price: 2000, // Hardcoded to 2000 cents ($20.00)
    interval: 'month',
    features: FEATURE_LIST // Use the new list
  };
  const priceDisplay = (2000 / 100).toFixed(2); // Hardcoded $20.00

  return (
    <div 
      className="min-h-screen py-16" 
      style={{ backgroundColor: COLORS.NAVY_BACKGROUND }}
    >
      <Helmet>
        <script async src="https://js.stripe.com/v3/buy-button.js"></script>
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back to Home Button */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-all text-gray-800 font-medium text-sm"
          >
            <Home className="w-4 h-4 text-gray-600" />
            Back to Home
          </button>
        </div>

        {/* Header - Updated for Single Plan */}
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4" style={{ color: COLORS.WHITE }}>
            The Unlimited Success Plan
          </h1>
          <p className="text-xl max-w-3xl mx-auto" style={{ color: COLORS.LIGHT_GRAY }}>
            The complete, all-in-one solution to master the NSW Selective School Writing Exam.
          </p>
        </div>

        
        {/* Pricing Card - Single Centered Plan */}
        <div className="max-w-sm mx-auto" style={{ width: '380px' }}>
          <div
            className="relative rounded-[20px] p-[2px] shadow-2xl"
            style={{ 
              background: `linear-gradient(to bottom right, ${COLORS.BLUE}, ${COLORS.PURPLE_START})`,
            }}
          >
            <div 
              className="bg-white rounded-[18px] overflow-hidden" 
              style={{ backgroundColor: COLORS.CARD_BACKGROUND }}
            >
              
              {// Card Header - Best Value Badge */}
              <div 
                className="text-white text-center py-3 text-lg font-semibold rounded-t-[18px]"
                style={{ backgroundImage: `linear-gradient(to right, ${COLORS.BLUE}, ${COLORS.PURPLE_START})` }}
              >
                Best Value
              </div>

              <div className="p-8">
                
                {/* Card Content */}
                <div className="text-center mb-8">
                  <h3 className="text-3xl font-bold mb-3" style={{ color: COLORS.WHITE }}>
                    {product.name}
                  </h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span 
                      className="text-6xl font-extrabold bg-clip-text text-transparent"
                      style={{ backgroundImage: `linear-gradient(to right, ${COLORS.PURPLE_START}, ${COLORS.BLUE})` }}
                    >
                      ${priceDisplay}
                    </span>
                    <span 
                      className="ml-2 text-xl" 
                      style={{ color: COLORS.LIGHT_GRAY }}
                    >
                      /{product.interval || 'month'}
                    </span>
                  </div>
                  {/* New Price Subtitle */}
                  <p className="text-sm font-medium mb-4" style={{ color: COLORS.LIGHT_GRAY }}>
                    First 7 days free • Cancel anytime
                  </p>
                  <p className="text-base" style={{ color: COLORS.LIGHT_GRAY }}>
                    Complete writing preparation package
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {FEATURE_LIST.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check 
                        className="h-5 w-5 mt-1 mr-3 flex-shrink-0" 
                        style={{ color: COLORS.GREEN_CHECK }} 
                      />
                      <span className="text-base" style={{ color: COLORS.WHITE }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Call-to-Action Button */}
                
                {/* Value Justification Section */}
                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                  <p className="text-sm font-semibold mb-2" style={{ color: COLORS.LIGHT_GRAY }}>
                    Less than the cost of a single hour of private tutoring
                  </p>
                  <p className="text-lg font-bold" style={{ color: COLORS.YELLOW_GOLD }}>
                    $20/month vs $60-$120/hour for a tutor
                  </p>
                </div>
                
                {/* Re-using the existing stripe-buy-button structure and applying new styles */}
                <div className="w-full">
                  <style>{`
                    .stripe-buy-button-container button {
                      width: 100%;
                      padding: 12px 0;
                      border-radius: 10px;
                      font-weight: 600;
                      color: ${COLORS.WHITE};
                      background-image: linear-gradient(to right, ${COLORS.PURPLE_START}, ${COLORS.PURPLE_END});
                      transition: all 0.3s ease;
                      border: none;
                      cursor: pointer;
                    }
                    .stripe-buy-button-container button:hover {
                      opacity: 0.9;
                      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
                    }
                  `}</style>
                  <div className="stripe-buy-button-container">
                    <stripe-buy-button
                      buy-button-id="buy_btn_1SN8blRq1JXLPYBD5pPclBAr" // Preserving existing ID
                      publishable-key="pk_test_51QuwqnRq1JXLPYBDxEWg3Us1FtE5tfm4FAXW7Aw2CHCwY7bvGkIgRIDBBlGWg61ooSB5xAC8bHuhGcUNR9AA5d8J00kRpp5TyC" // Preserving existing key
                      client-reference-id={user?.id}
                      customer-email={user?.email}
                      className="w-full"
                    >
                      Start trial
                    </stripe-buy-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Removed Features Section */}

      </div>
    </div>
  );
}

// Also export as PricingPageWithFixedVerification for backward compatibility
export const PricingPageWithFixedVerification = PricingPage;