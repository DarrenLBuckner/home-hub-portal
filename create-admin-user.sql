-- ==================================================
-- CREATE ADMIN USER FOR PORTAL HUB
-- Run this in Supabase SQL Editor for Portal Hub database
-- ==================================================

-- Option 1: Create new admin user (if admin@test.com doesn't exist)
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Insert into auth.users (this creates the authentication record)
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@test.com',
        crypt('Admin123!', gen_salt('bf')),
        NOW(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('Admin123!', gen_salt('bf')),
        updated_at = NOW()
    RETURNING id INTO new_user_id;

    -- Get the user ID (either newly created or existing)
    IF new_user_id IS NULL THEN
        SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@test.com';
    END IF;

    -- Insert or update the profile
    INSERT INTO public.profiles (
        id,
        email,
        user_type,
        first_name,
        last_name,
        created_at,
        updated_at
    ) VALUES (
        new_user_id,
        'admin@test.com',
        'admin',
        'Admin',
        'User',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        user_type = 'admin',
        email = 'admin@test.com',
        first_name = 'Admin',
        last_name = 'User',
        updated_at = NOW();

    RAISE NOTICE 'Admin user created/updated with ID: %', new_user_id;
END $$;

-- ==================================================
-- Option 2: Simple update if user already exists
-- ==================================================

-- If admin@test.com already exists, just update to admin privileges
UPDATE public.profiles 
SET 
    user_type = 'admin',
    updated_at = NOW()
WHERE email = 'admin@test.com';

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Check if admin user was created successfully
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.user_type,
    p.first_name,
    p.last_name,
    p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@test.com';

-- Check all admin users
SELECT 
    id,
    email,
    user_type,
    first_name,
    last_name,
    created_at
FROM public.profiles
WHERE user_type IN ('admin', 'super_admin')
ORDER BY created_at;

-- ==================================================
-- ADDITIONAL ADMIN SETUP (Optional)
-- ==================================================

-- Create a super admin user as well
DO $$
DECLARE
    super_user_id UUID;
BEGIN
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'superadmin@test.com',
        crypt('SuperAdmin123!', gen_salt('bf')),
        NOW(),
        NULL,
        NULL,
        '{"provider": "email", "providers": ["email"]}',
        '{}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt('SuperAdmin123!', gen_salt('bf')),
        updated_at = NOW()
    RETURNING id INTO super_user_id;

    IF super_user_id IS NULL THEN
        SELECT id INTO super_user_id FROM auth.users WHERE email = 'superadmin@test.com';
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        user_type,
        first_name,
        last_name,
        created_at,
        updated_at
    ) VALUES (
        super_user_id,
        'superadmin@test.com',
        'super_admin',
        'Super',
        'Admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        user_type = 'super_admin',
        email = 'superadmin@test.com',
        first_name = 'Super',
        last_name = 'Admin',
        updated_at = NOW();

    RAISE NOTICE 'Super admin user created/updated with ID: %', super_user_id;
END $$;