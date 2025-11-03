/*
  # Fix user_access_status records for existing users
  
  1. Changes
    - Create user_access_status records for all existing users who don't have one
    - Grant all existing users access (manual_override = true) to prevent blocking
    - Ensure the handle_new_user trigger is working correctly
  
  2. Security
    - Maintains existing RLS policies
    - Uses service role permissions for data migration
*/

-- Create user_access_status records for all existing users who don't have one
INSERT INTO public.user_access_status (id, email, has_access, payment_verified, manual_override, temp_access_until)
SELECT 
  u.id,
  u.email,
  true as has_access,
  false as payment_verified,
  true as manual_override,
  NULL as temp_access_until
FROM auth.users u
LEFT JOIN public.user_access_status uas ON u.id = uas.id
WHERE uas.id IS NULL;

-- Verify the handle_new_user function exists and works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO public.user_profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Insert into user_access_status with temporary access
  INSERT INTO public.user_access_status (id, email, has_access, payment_verified, manual_override, temp_access_until)
  VALUES (
    new.id, 
    new.email, 
    true,
    false,
    true,
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is set up correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
