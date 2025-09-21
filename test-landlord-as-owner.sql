-- Test your theory: Change landlord to owner type temporarily
-- This will test if the issue is specifically with 'landlord' user_type

-- Backup current state
SELECT 'Current landlord profile:' as info, user_type, email 
FROM profiles 
WHERE email = 'landlord@test.com';

-- Temporarily change landlord to owner
UPDATE profiles 
SET user_type = 'owner'
WHERE email = 'landlord@test.com';

-- Verify the change
SELECT 'Updated to owner:' as info, user_type, email 
FROM profiles 
WHERE email = 'landlord@test.com';