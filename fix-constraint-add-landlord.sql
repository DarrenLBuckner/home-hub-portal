-- Fix the constraint to allow 'landlord' user_type
-- This will add 'landlord' to the allowed user_types

-- First, drop the existing constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Create a new constraint that includes 'landlord'
ALTER TABLE profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('admin', 'super_admin', 'agent', 'owner', 'landlord'));

-- Verify the constraint was updated
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'profiles_user_type_check' 
  AND conrelid = 'profiles'::regclass;