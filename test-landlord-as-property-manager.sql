-- Test your theory: Change landlord to property_manager type temporarily
-- This will test if the issue is specifically with 'landlord' user_type

-- Backup current state
SELECT 'Current landlord profile:' as info, user_type, email 
FROM profiles 
WHERE email = 'landlord@test.com';

-- Temporarily change landlord to property_manager (creative alternative)
UPDATE profiles 
SET user_type = 'property_manager'
WHERE email = 'landlord@test.com';

-- Verify the change
SELECT 'Updated to property_manager:' as info, user_type, email 
FROM profiles 
WHERE email = 'landlord@test.com';