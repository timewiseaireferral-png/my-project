import { PlanType } from '../contexts/SubscriptionContext';

// Define feature categories
export const FEATURES = {
  // Free tier features
  PRACTICE_EXAM: 'practice_exam',
  AI_FEEDBACK_REPORT: 'ai_feedback_report',

  // Pro tier features
  WRITING_TOOLS: 'writing_tools',
  TEXT_TYPE_TEMPLATES: 'text_type_templates',
  PROGRESS_TRACKING: 'progress_tracking',
  EMAIL_SUPPORT: 'email_support',
  LEARNING_MODE: 'learning_mode',
  CUSTOM_PROMPTS: 'custom_prompts',
  UNLIMITED_AI_COACHING: 'unlimited_ai_coaching',
  FULL_TEMPLATES: 'full_templates',
  UNLIMITED_PRACTICE: 'unlimited_practice',
  ADVANCED_ANALYSIS: 'advanced_analysis',
  PRIORITY_SUPPORT: 'priority_support'
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

// Define which routes require Pro access
export const PRO_ROUTES = [
  '/writing',
  '/progress',
  '/dashboard',
  '/learning',
  '/settings'
];

// Define which routes are free
export const FREE_ROUTES = [
  '/',
  '/home',
  '/pricing',
  '/about',
  '/faq',
  '/help',
  '/evaluation'
];

/**
 * Check if a route requires Pro access
 */
export const isProRoute = (path: string): boolean => {
  return PRO_ROUTES.some(route => path.startsWith(route));
};

/**
 * Check if a route is accessible to free users
 */
export const isFreeRoute = (path: string): boolean => {
  return FREE_ROUTES.some(route => path === route || path.startsWith(route));
};

/**
 * Get a user-friendly feature name
 */
export const getFeatureName = (feature: Feature): string => {
  const names: Record<Feature, string> = {
    [FEATURES.PRACTICE_EXAM]: 'Practice Exam',
    [FEATURES.AI_FEEDBACK_REPORT]: 'AI Feedback Report',
    [FEATURES.WRITING_TOOLS]: 'Writing Tools',
    [FEATURES.TEXT_TYPE_TEMPLATES]: 'Text Type Templates',
    [FEATURES.PROGRESS_TRACKING]: 'Progress Tracking',
    [FEATURES.EMAIL_SUPPORT]: 'Email Support',
    [FEATURES.LEARNING_MODE]: 'Learning Mode',
    [FEATURES.CUSTOM_PROMPTS]: 'Custom Prompts',
    [FEATURES.UNLIMITED_AI_COACHING]: 'Unlimited AI Coaching',
    [FEATURES.FULL_TEMPLATES]: 'Full Template Access',
    [FEATURES.UNLIMITED_PRACTICE]: 'Unlimited Practice',
    [FEATURES.ADVANCED_ANALYSIS]: 'Advanced Writing Analysis',
    [FEATURES.PRIORITY_SUPPORT]: 'Priority Technical Support'
  };

  return names[feature] || feature;
};

/**
 * Get a description for why a feature is Pro-only
 */
export const getFeatureDescription = (feature: Feature): string => {
  const descriptions: Record<Feature, string> = {
    [FEATURES.PRACTICE_EXAM]: 'Take practice exams to prepare for the NSW Selective School test.',
    [FEATURES.AI_FEEDBACK_REPORT]: 'Get detailed AI-powered feedback on your writing.',
    [FEATURES.WRITING_TOOLS]: 'Access advanced writing tools and helpers.',
    [FEATURES.TEXT_TYPE_TEMPLATES]: 'Use professional templates for different text types.',
    [FEATURES.PROGRESS_TRACKING]: 'Track your improvement over time with detailed analytics.',
    [FEATURES.EMAIL_SUPPORT]: 'Get help via email from our support team.',
    [FEATURES.LEARNING_MODE]: 'Access structured learning paths and tutorials.',
    [FEATURES.CUSTOM_PROMPTS]: 'Create and practice with your own writing prompts.',
    [FEATURES.UNLIMITED_AI_COACHING]: 'Get unlimited AI coaching and feedback on your writing.',
    [FEATURES.FULL_TEMPLATES]: 'Access all 15+ professional writing templates.',
    [FEATURES.UNLIMITED_PRACTICE]: 'Practice as much as you want with no limits.',
    [FEATURES.ADVANCED_ANALYSIS]: 'Get detailed analysis of vocabulary, structure, and style.',
    [FEATURES.PRIORITY_SUPPORT]: 'Get priority technical support when you need help.'
  };

  return descriptions[feature] || 'This is a premium feature.';
};

/**
 * Server-side validation: Check if user has access
 */
export interface UserSubscriptionData {
  subscription_status: string;
  current_period_end: string | null;
  payment_verified: boolean;
  manual_override: boolean;
}

export const validateProAccess = (userData: UserSubscriptionData): boolean => {
  const { subscription_status, current_period_end, payment_verified, manual_override } = userData;

  // Manual override grants access
  if (manual_override) {
    return true;
  }

  // Check if subscription is active or trialing
  if (subscription_status === 'active' || subscription_status === 'trialing') {
    if (current_period_end) {
      const periodEndDate = new Date(current_period_end);
      const now = new Date();
      return periodEndDate > now;
    }
    // If trialing and no end date, allow access
    if (subscription_status === 'trialing') {
      return true;
    }
  }

  // Fallback to payment_verified
  return payment_verified === true;
};
