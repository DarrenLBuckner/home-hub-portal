-- Check what user_types are allowed by the constraint
-- This will show us the exact constraint definition

SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%user_type%' 
  AND conrelid = 'profiles'::regclass;

-- Also check current valid user_types in the table
SELECT DISTINCT user_type 
FROM profiles 
ORDER BY user_type;