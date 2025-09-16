-- ==================================================
-- CHECK RLS POLICIES FOR ADMIN ACCESS
-- Run this in Supabase SQL Editor for Portal Hub database
-- ==================================================

-- 1. Check what RLS policies exist on properties table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;

-- 2. Check if RLS is enabled on properties table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'properties' 
AND schemaname = 'public';

-- 3. Test admin access - try to read properties as authenticated user
-- (This simulates what the dashboard is trying to do)
SELECT 
    id,
    title,
    status,
    user_id,
    created_at
FROM properties 
WHERE status = 'pending'
LIMIT 5;

-- 4. Check current user context
SELECT 
    current_user,
    session_user,
    current_setting('app.current_user_id', true) as app_user_id;

-- ==================================================
-- TEMPORARY FIX: Add admin bypass policy
-- ==================================================

-- Add a policy that allows admin/super_admin users to read all properties
CREATE POLICY "Admin users can read all properties" 
ON properties 
FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- Add a policy that allows admin/super_admin users to update all properties  
CREATE POLICY "Admin users can update all properties" 
ON properties 
FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.user_type IN ('admin', 'super_admin')
    )
);

-- ==================================================
-- VERIFICATION
-- ==================================================

-- Check if the new policies were created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'properties' 
AND policyname LIKE '%Admin%'
ORDER BY policyname;