-- Fix missing landlord profile
-- Run this in Supabase SQL Editor

-- Insert the landlord profile for the authenticated user
INSERT INTO profiles (id, email, first_name, last_name, user_type, created_at, updated_at)
VALUES (
  'e343555d-7e70-4890-b073-2b93ba7f0546',
  'landlord@test.com',
  'Test',
  'Landlord',
  'landlord',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  user_type = 'landlord',
  email = 'landlord@test.com',
  first_name = 'Test',
  last_name = 'Landlord',
  updated_at = now();

-- Verify the insert
SELECT id, email, user_type, first_name, last_name 
FROM profiles 
WHERE email = 'landlord@test.com';