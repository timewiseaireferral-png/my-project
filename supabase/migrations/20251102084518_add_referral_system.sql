/*
  # Add Referral System Tables and Columns

  1. Changes
    - Add `referral_count` to `user_profiles` to track successful referrals.
    - Add `referral_code` to `user_profiles` for the user's unique code (defaults to user ID).
    - Add `referred_by` to `user_profiles` to track who referred the user.
    - Create `referral_log` table to track all referral events.

  2. Security
    - Maintain RLS policies.
*/

-- 1. Add columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS referred_by TEXT DEFAULT NULL;

-- 2. Update existing users to have a referral_code if they don't have one
UPDATE public.user_profiles
SET referral_code = id::TEXT
WHERE referral_code IS NULL;

-- 3. Update handle_new_user function to set referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (
    id, 
    email,
    payment_status, 
    payment_verified,
    manual_override,
    subscription_status,
    temp_access_until,
    referral_code
  )
  VALUES (
    NEW.id,
    NEW.email,
    'pending',
    false,
    false,
    'free',
    NOW() + INTERVAL '24 hours',
    NEW.id::TEXT
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Always return NEW to allow the auth.users insert to complete
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create referral_log table (optional but good for tracking)
CREATE TABLE IF NOT EXISTS referral_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referral_code_used TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on referral_log
ALTER TABLE referral_log ENABLE ROW LEVEL SECURITY;

-- Policies for referral_log
CREATE POLICY "Users can view their own referral log entries"
  ON referral_log FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can insert their own referral log entries"
  ON referral_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = referred_user_id);

-- 5. Function to handle successful referral (e.g., on payment webhook)
CREATE OR REPLACE FUNCTION public.complete_referral(p_referred_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- 1. Get the referrer's ID from the referred user's profile
  SELECT referred_by INTO v_referral_code
  FROM public.user_profiles
  WHERE id = p_referred_user_id;

  IF v_referral_code IS NULL THEN
    RAISE NOTICE 'User % was not referred.', p_referred_user_id;
    RETURN FALSE;
  END IF;

  -- 2. Find the referrer's user ID using the referral code
  SELECT id INTO v_referrer_id
  FROM public.user_profiles
  WHERE referral_code = v_referral_code;

  IF v_referrer_id IS NULL THEN
    RAISE NOTICE 'Referrer not found for code %.', v_referral_code;
    RETURN FALSE;
  END IF;

  -- 3. Check if referral is already completed
  IF EXISTS (
    SELECT 1 FROM referral_log 
    WHERE referred_user_id = p_referred_user_id AND status = 'completed'
  ) THEN
    RAISE NOTICE 'Referral for user % is already completed.', p_referred_user_id;
    RETURN FALSE;
  END IF;

  -- 4. Increment the referrer's referral_count
  UPDATE public.user_profiles
  SET referral_count = referral_count + 1
  WHERE id = v_referrer_id;

  -- 5. Update or insert into referral_log
  INSERT INTO referral_log (referrer_id, referred_user_id, referral_code_used, status)
  VALUES (v_referrer_id, p_referred_user_id, v_referral_code, 'completed')
  ON CONFLICT (referred_user_id) DO UPDATE
  SET 
    referrer_id = EXCLUDED.referrer_id,
    referral_code_used = EXCLUDED.referral_code_used,
    status = 'completed',
    created_at = NOW();

  RAISE NOTICE 'Referral completed: User % referred by % (Code: %).', p_referred_user_id, v_referrer_id, v_referral_code;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;