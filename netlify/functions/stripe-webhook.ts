import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// FIX: Added auth options to ensure the client is correctly initialized for a serverless environment
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

async function applyReferralReward(paidReferralsCount: number, subscriptionId: string) {
  let couponId: string | null = null;

  try {
    switch (paidReferralsCount) {
      case 1:
        // Tier 1: 1 Free Month (100% off for 1 month)
        console.log('🎁 Applying Tier 1 Reward: 1 Free Month');
        const couponTier1 = await stripe.coupons.create({
          percent_off: 100,
          duration: 'once',
          name: 'Tier 1 Referral Reward',
        });
        couponId = couponTier1.id;
        break;

      case 2:
        // Tier 2: $5 Off for 3 Months
        console.log('🎁 Applying Tier 2 Reward: $5 Off for 3 Months');
        const couponTier2 = await stripe.coupons.create({
          amount_off: 500, // $5.00 in cents
          duration: 'repeating',
          duration_in_months: 3,
          currency: 'usd',
          name: 'Tier 2 Referral Reward',
        });
        couponId = couponTier2.id;
        break;

      case 5:
        // Tier 3: $10 Off for 5 Months
        console.log('🎁 Applying Tier 3 Reward: $10 Off for 5 Months');
        const couponTier3 = await stripe.coupons.create({
          amount_off: 1000, // $10.00 in cents
          duration: 'repeating',
          duration_in_months: 5,
          currency: 'usd',
          name: 'Tier 3 Referral Reward',
        });
        couponId = couponTier3.id;
        break;

      default:
        console.log(`📈 Referral count is ${paidReferralsCount}, no reward to apply.`);
        return;
    }

    if (couponId && subscriptionId) {
      await stripe.subscriptions.update(subscriptionId, {
        coupon: couponId,
      });
      console.log(`✅ Applied coupon ${couponId} to subscription ${subscriptionId}`);
    } else if (!subscriptionId) {
        console.error('❌ Cannot apply coupon, subscription ID is missing for the referrer.');
    }

  } catch (error) {
    console.error('❌ Error applying referral reward:', error);
  }
}

function getPlanTypeFromPriceId(priceId: string): string {
  const planMapping: { [key: string]: string } = {
    'price_1RXEqERtcrDpOK7ME3QH9uzu': 'premium_plan',
    'price_1QzeXvRtcrDpOK7M5IHfp8ES': 'premium_plan',
  };
  return planMapping[priceId] || 'premium_plan';
}

// FIX: Refactored to remove the failing supabase.auth.admin.getUserByEmail call
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('🎉 Processing checkout session completed:', session.id);
  
  const customerEmail = session.customer_email || session.customer_details?.email;
  const stripeCustomerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  
  if (!customerEmail) {
    throw new Error('No customer email provided');
  }

  // 1. Look up the user profile by email to ensure the user exists before proceeding.
  // This replaces the failing auth.admin.getUserByEmail call.
  let { data: profileData, error: profileLookupError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', customerEmail)
    .maybeSingle();

  if (profileLookupError) {
    console.error('❌ Supabase profile lookup failed:', profileLookupError);
    throw profileLookupError;
  }

  if (!profileData) {
    // If user profile is not found, we cannot proceed with the update.
    console.log('⚠️ User profile not found for email:', customerEmail, 'Skipping update.');
    return;
  }
  
  const userId = profileData.id;
  console.log('✅ Found Supabase user ID from profile table:', userId);
  console.log('👤 Processing payment for email:', customerEmail);

  let planType = 'premium_plan';
  let currentPeriodStart = new Date().toISOString();
  let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (subscriptionId) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      planType = getPlanTypeFromPriceId(priceId);
      currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
      currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
      console.log('💰 Plan type:', planType, 'Period end:', currentPeriodEnd);
    } catch (error) {
      console.error('⚠️ Error fetching subscription:', error);
    }
  }

  try {
    // 2. Update user_profiles using the email lookup
    console.log('📝 Updating user_profiles table...');
    const { error: profileError, count: profileCount } = await supabase
      .from('user_profiles')
      .update({
        payment_status: 'verified',
        payment_verified: true,
        subscription_status: 'active',
        subscription_plan: planType,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscriptionId,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        last_payment_date: new Date().toISOString(),
        temporary_access_expires: currentPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('email', customerEmail); 

    if (profileError) {
      console.error('❌ Error updating user_profiles:', profileError);
      throw profileError;
    }
    console.log('✅ Updated user_profiles successfully (' + profileCount + ' rows affected)');

    if (profileCount === 0) {
      // This should not happen since we checked for profileData existence above, 
      // but it serves as a final check and avoids the original profile creation logic.
      console.log('⚠️ No existing user profile found with email. Update failed.');
    }

        // START: Tiered Referral Logic
    const referrerId = session.metadata?.referrerId;
    if (referrerId) {
      console.log(`📈 Referred by user: ${referrerId}. Incrementing count.`);

      // Atomically increment the referrer's paid_referrals_count
      const { data: rpcData, error: rpcError } = await supabase.rpc('increment_referral_count', {
        user_id: referrerId,
      });

      if (rpcError) {
        console.error('❌ Error calling increment_referral_count RPC:', rpcError);
      } else {
        const newReferralCount = rpcData;
        console.log(`✅ Referrer's new count: ${newReferralCount}`);

        // Fetch the referrer's Stripe customer ID to apply the reward
        const { data: referrerProfile, error: referrerError } = await supabase
          .from('user_profiles')
          .select('stripe_customer_id, stripe_subscription_id')
          .eq('id', referrerId)
          .single();

        if (referrerError || !referrerProfile) {
          console.error('❌ Error fetching referrer profile:', referrerError);
        } else {
          await applyReferralReward(newReferralCount, referrerProfile.stripe_subscription_id);
        }
      }
    }
    // END: Tiered Referral Logic

    console.log('🎊 Checkout session processing completed successfully!');

  } catch (error) {
    console.error('❌ Error in payment processing:', error);
    throw error;
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log('🔄 Processing subscription change:', subscription.id, 'status:', subscription.status);
  
  const customerId = subscription.customer as string;
  const isActive = subscription.status === 'active';
  
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscription.status,
      payment_verified: isActive,
      payment_status: isActive ? 'verified' : 'cancelled',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      temporary_access_expires: isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  if (updateError) {
    console.error('❌ Error updating subscription:', updateError);
  } else {
    console.log('✅ Subscription status updated');
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Processing invoice payment succeeded:', invoice.id);
  
  const customerId = invoice.customer as string;
  
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      last_payment_date: new Date().toISOString(),
      payment_status: 'verified',
      payment_verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId);

  if (updateError) {
    console.error('❌ Error updating payment date:', updateError);
  } else {
    console.log('✅ Payment date updated');
  }
}

export async function handler(event: any) {
  if (event.httpMethod !== 'POST'   ) {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // FIX: Robustly check for both lowercase and canonical header name
  const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  let stripeEvent: Stripe.Event;

  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');

    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed: ' + err.message);
    return { statusCode: 400, body: 'Webhook Error: ' + err.message };
  }

  console.log('🎯 Processing webhook event: ' + stripeEvent.type);
  console.log('📋 Event ID: ' + stripeEvent.id);

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        const checkoutSession = stripeEvent.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(checkoutSession);
        break;
        
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
        
      case 'invoice.payment.succeeded':
        const invoice = stripeEvent.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
        
      case 'customer.subscription.created':
        console.log('ℹ️ Subscription created - handled by checkout.session.completed');
        break;
        
      default:
        console.log('ℹ️ Unhandled event type: ' + stripeEvent.type);
    }

    console.log('✅ Successfully processed webhook event: ' + stripeEvent.type);
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        received: true, 
        success: true,
        event_type: stripeEvent.type,
        event_id: stripeEvent.id
      }) 
    };
    
  } catch (error) {
    console.error('❌ Error processing webhook event:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Internal Server Error', 
        success: false,
        event_type: stripeEvent.type,
        message: error instanceof Error ? error.message : 'Unknown error'
      }) 
    };
  }
}
