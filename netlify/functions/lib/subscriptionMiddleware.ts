import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  plan: 'Free' | 'Pro';
  userId: string | null;
  error?: string;
}

/**
 * Validate user's Pro subscription server-side
 * This prevents users from bypassing client-side restrictions
 */
export async function validateProSubscription(
  authHeader: string | undefined
): Promise<SubscriptionCheckResult> {
  // Check if authorization header exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid authorization header');
    return {
      hasAccess: false,
      plan: 'Free',
      userId: null,
      error: 'No authorization header'
    };
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.log('❌ Invalid or expired token');
      return {
        hasAccess: false,
        plan: 'Free',
        userId: null,
        error: 'Invalid or expired token'
      };
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Fetch user's subscription status from user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_status, current_period_end, payment_verified, manual_override')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ Error fetching user profile:', profileError);
      return {
        hasAccess: false,
        plan: 'Free',
        userId: user.id,
        error: 'Profile not found'
      };
    }

    console.log(`📊 User profile:`, profile);

    // Check if user has Pro access
    const hasProAccess = validateUserHasProAccess(profile);

    return {
      hasAccess: hasProAccess,
      plan: hasProAccess ? 'Pro' : 'Free',
      userId: user.id,
    };

  } catch (error) {
    console.error('❌ Error validating subscription:', error);
    return {
      hasAccess: false,
      plan: 'Free',
      userId: null,
      error: 'Internal error validating subscription'
    };
  }
}

/**
 * Helper function to determine if a user has Pro access
 */
function validateUserHasProAccess(profile: {
  subscription_status: string;
  current_period_end: string | null;
  payment_verified: boolean;
  manual_override: boolean;
}): boolean {
  const { subscription_status, current_period_end, payment_verified, manual_override } = profile;

  // Manual override grants immediate access
  if (manual_override) {
    console.log('✅ Manual override active');
    return true;
  }

  // Check if subscription is active or trialing
  if (subscription_status === 'active' || subscription_status === 'trialing') {
    // Check if period end is in the future
    if (current_period_end) {
      const periodEndDate = new Date(current_period_end);
      const now = new Date();

      if (periodEndDate > now) {
        console.log('✅ Valid subscription period');
        return true;
      } else {
        console.log('❌ Subscription expired');
        return false;
      }
    }

    // If trialing and no end date, allow access
    if (subscription_status === 'trialing') {
      console.log('✅ Trial period active');
      return true;
    }
  }

  // Fallback to payment_verified
  if (payment_verified) {
    console.log('✅ Payment verified');
    return true;
  }

  console.log('❌ No valid subscription found');
  return false;
}

/**
 * Middleware response helpers
 */
export function unauthorizedResponse(message: string = 'Access denied. Pro subscription required.') {
  return {
    statusCode: 403,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'Forbidden',
      message,
      upgrade_url: 'https://writingmate.co/pricing'
    })
  };
}

export function successResponse(data: any) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data)
  };
}

export function errorResponse(message: string, statusCode: number = 500) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: 'Error',
      message
    })
  };
}
