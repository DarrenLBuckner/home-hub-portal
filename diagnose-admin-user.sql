-- ==================================================
-- DIAGNOSE ADMIN USER ISSUES
-- Run this in Supabase SQL Editor for Portal Hub database
-- ==================================================

-- 1. Check all users in profiles table to see what exists
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name,
    created_at,
    updated_at
FROM public.profiles
ORDER BY created_at DESC;

-- 2. Check auth.users table to see what authentication records exist
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 3. Join both tables to see the complete picture
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    u.last_sign_in_at,
    p.user_type,
    p.first_name,
    p.last_name,
    CASE 
        WHEN p.user_type = 'admin' THEN '✅ Admin Access'
        WHEN p.user_type = 'super_admin' THEN '✅ Super Admin Access'
        WHEN p.user_type IS NULL THEN '❌ No Profile Found'
        ELSE '❌ Wrong User Type: ' || p.user_type
    END AS admin_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 4. Check for common admin email patterns
SELECT 
    email,
    user_type,
    'Found potential admin user' as note
FROM public.profiles
WHERE email ILIKE '%admin%' 
   OR email ILIKE '%test%'
   OR user_type IN ('admin', 'super_admin')
ORDER BY email;

-- 5. Count users by type
SELECT 
    user_type,
    COUNT(*) as count
FROM public.profiles
GROUP BY user_type
ORDER BY count DESC;

-- ==================================================
-- QUICK FIXES (uncomment and modify as needed)
-- ==================================================

-- Fix 1: If you find your email but wrong user_type, update it:
-- UPDATE profiles SET user_type = 'admin' WHERE email = 'YOUR_EMAIL_HERE';

-- Fix 2: If user exists in auth.users but not in profiles, create profile:
-- INSERT INTO public.profiles (id, email, user_type, first_name, last_name, created_at, updated_at)
-- SELECT id, email, 'admin', 'Admin', 'User', NOW(), NOW()
-- FROM auth.users 
-- WHERE email = 'YOUR_EMAIL_HERE' 
-- AND id NOT IN (SELECT id FROM public.profiles);

-- Fix 3: Update existing user to admin (replace YOUR_EMAIL_HERE):
-- UPDATE profiles 
-- SET user_type = 'admin', updated_at = NOW() 
-- WHERE email = 'YOUR_EMAIL_HERE';

-- ==================================================
-- VERIFICATION AFTER FIXES
-- ==================================================

-- Run this after making changes to verify admin access:
-- SELECT 
--     u.email,
--     p.user_type,
--     CASE 
--         WHEN p.user_type IN ('admin', 'super_admin') THEN '✅ Can access admin dashboard'
--         ELSE '❌ Cannot access admin dashboard'
--     END AS dashboard_access
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE u.email = 'YOUR_EMAIL_HERE';