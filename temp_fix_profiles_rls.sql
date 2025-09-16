-- Fix profiles table RLS policies
-- Allow users to read their own profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profiles  
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type IN ('admin', 'super_admin')
    )
  );
