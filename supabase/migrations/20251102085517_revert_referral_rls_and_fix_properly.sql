/*
  # Revert and Fix Referral RLS Properly

  1. Changes
    - Restore the original RLS policy
    - Ensure users can read their own profile with all columns

  2. Security
    - Users can only read their own full profile
    - Maintain strict RLS policies
*/

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can read referral codes from any profile" ON public.user_profiles;

-- Restore the original policy if it was dropped
DROP POLICY IF EXISTS "Users can read own full profile" ON public.user_profiles;

-- Create the correct policy
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);