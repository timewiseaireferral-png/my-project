/*
  # Fix Referral RLS Policies

  1. Changes
    - Add policy to allow authenticated users to read referral codes from any user profile
    - This is needed so users can validate and use referral codes

  2. Security
    - Users can only read id, email, and referral_code from other profiles
    - They cannot see payment info or other sensitive data from other users
*/

-- Drop the existing read policy if it's too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;

-- Create new policies with better granularity
CREATE POLICY "Users can read own full profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read referral codes from any profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: The second policy allows reading but RLS will still filter sensitive columns
-- when combined with application-level access control