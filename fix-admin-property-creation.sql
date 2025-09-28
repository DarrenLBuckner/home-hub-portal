-- Fix Admin Property Creation - Add Missing RLS Policy
-- The issue is that admin users cannot create properties because there's no INSERT policy for admins

-- Add the missing admin INSERT policy to allow admins to create properties
CREATE POLICY "Admins can create properties" ON properties
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Also add a policy for admins to delete properties if needed
CREATE POLICY "Admins can delete all properties" ON properties
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.user_type = 'admin'
        )
    );

-- Verify the policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'properties'
ORDER BY policyname;