-- Check what auth users and profiles currently exist
-- Run this in Supabase SQL Editor to see current state

-- Check auth.users table
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email LIKE '%@test.com'
ORDER BY email;

-- Check profiles table
SELECT id, email, user_type, first_name, last_name
FROM profiles
WHERE email LIKE '%@test.com'
ORDER BY email;

-- Check for any orphaned profiles (profiles without auth users)
SELECT p.id, p.email, p.user_type
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;