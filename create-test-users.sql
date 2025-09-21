-- Create test users for agent and landlord dashboards
-- Run this in Supabase SQL Editor

-- First check if users already exist, then insert only if they don't
-- Delete existing test users if they exist (to avoid conflicts)
DELETE FROM profiles WHERE email IN ('agent@test.com', 'landlord@test.com');

-- Insert agent test user profile
INSERT INTO profiles (id, email, first_name, last_name, user_type, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'agent@test.com',
  'Test',
  'Agent',
  'agent',
  now(),
  now()
);

-- Insert landlord test user profile  
INSERT INTO profiles (id, email, first_name, last_name, user_type, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'landlord@test.com',
  'Test',
  'Landlord',
  'landlord',
  now(),
  now()
);

-- Show all test users
SELECT email, user_type, first_name, last_name FROM profiles 
WHERE email LIKE '%@test.com' 
ORDER BY user_type;