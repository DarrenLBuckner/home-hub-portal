-- Check if RLS auth.uid() matches the landlord profile ID
-- Run this while logged in as landlord@test.com

-- Check current auth.uid()
SELECT auth.uid() as current_auth_uid;

-- Check if landlord profile is accessible via RLS
SELECT id, email, user_type 
FROM profiles 
WHERE email = 'landlord@test.com';

-- Check if landlord profile is accessible via auth.uid() RLS policy
SELECT id, email, user_type 
FROM profiles 
WHERE id = auth.uid();

-- Show all RLS policies on profiles table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';