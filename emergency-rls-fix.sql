-- EMERGENCY: Temporarily disable all RLS policies to fix infinite recursion
-- This removes the recursive policy causing "infinite recursion detected"

-- Drop all existing policies that are causing recursion
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;  
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

-- Simple, non-recursive policies
CREATE POLICY "Allow authenticated users to read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- TEMPORARY: Allow all authenticated users to read profiles (remove recursion)
CREATE POLICY "Temporary read access for debugging" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');