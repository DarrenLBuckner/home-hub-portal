-- Test your theory: Change landlord to agent type temporarily
-- This will test if the issue is specifically with 'landlord' user_type

-- Backup current state
SELECT 'Current landlord profile:' as info, user_type, email 
FROM profiles 
WHERE email = 'landlord@test.com';

-- Temporarily change landlord to agent (we know agent works)
UPDATE profiles 
SET user_type = 'agent'
WHERE email = 'landlord@test.com';

-- Verify the change
SELECT 'Updated to agent:' as info, user_type, email 
FROM profiles 
WHERE email = 'landlord@test.com';