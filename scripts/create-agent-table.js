const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAgentVettingTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Creating agent_vetting table...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
-- Create agent_vetting table for agent registration
CREATE TABLE IF NOT EXISTS agent_vetting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Agent professional info
  selected_plan TEXT,
  country TEXT,
  years_experience TEXT,
  company_name TEXT,
  license_number TEXT,
  license_type TEXT,
  specialties TEXT,
  target_region TEXT,
  
  -- References (optional)
  reference1_name TEXT,
  reference1_phone TEXT,
  reference1_email TEXT,
  reference2_name TEXT,
  reference2_phone TEXT,
  reference2_email TEXT,
  
  -- Promo code info
  promo_code TEXT,
  promo_benefits TEXT,
  promo_spot_number INTEGER,
  is_founding_member BOOLEAN DEFAULT FALSE,
  
  -- Vetting status
  user_type TEXT DEFAULT 'agent',
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'under_review')),
  
  -- Rejection reason
  rejection_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_vetting_user_id ON agent_vetting(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_vetting_status ON agent_vetting(status);

-- Enable RLS
ALTER TABLE agent_vetting ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own vetting records" ON agent_vetting;
DROP POLICY IF EXISTS "Users can insert their own vetting records" ON agent_vetting;
DROP POLICY IF EXISTS "Admins can view all vetting records" ON agent_vetting;
DROP POLICY IF EXISTS "Admins can update all vetting records" ON agent_vetting;

-- RLS policies - agents can only see their own data
CREATE POLICY "Users can view their own vetting records"
ON agent_vetting FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vetting records"
ON agent_vetting FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can see and update all vetting records
CREATE POLICY "Admins can view all vetting records"
ON agent_vetting FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all vetting records"
ON agent_vetting FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);
`
  });

  if (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } else {
    console.log('✅ agent_vetting table created successfully!');
  }
}

createAgentVettingTable().catch(console.error);