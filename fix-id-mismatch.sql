-- Fix ID mismatch between auth.users and profiles
-- This will find the correct auth user ID and update the profile

-- First, let's see what auth user actually exists for landlord@test.com
SELECT 'Auth User:' as type, id, email, created_at 
FROM auth.users 
WHERE email = 'landlord@test.com';

-- Show current profile
SELECT 'Current Profile:' as type, id, email, user_type 
FROM profiles 
WHERE email = 'landlord@test.com';

-- Update the profile to use the correct auth user ID
-- Replace the profile ID with the actual auth user ID
WITH auth_user AS (
  SELECT id as auth_id 
  FROM auth.users 
  WHERE email = 'landlord@test.com'
)
UPDATE profiles 
SET id = (SELECT auth_id FROM auth_user)
WHERE email = 'landlord@test.com' 
  AND id != (SELECT auth_id FROM auth_user);

-- Verify the fix
SELECT 'Fixed Profile:' as type, id, email, user_type 
FROM profiles 
WHERE email = 'landlord@test.com';