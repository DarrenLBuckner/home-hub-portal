const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function setupAgentTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('🔄 Checking if agent_vetting table exists...');

  // First, check if table exists
  const { data: tables, error: tableError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'agent_vetting');

  if (tableError) {
    console.log('⚠️ Could not check table existence, proceeding with creation...');
  } else if (tables && tables.length > 0) {
    console.log('✅ agent_vetting table already exists!');
    return;
  }

  console.log('🔄 Creating agent_vetting table...');

  // Create the table using direct SQL
  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS agent_vetting (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      selected_plan TEXT,
      country TEXT,
      years_experience TEXT,
      company_name TEXT,
      license_number TEXT,
      license_type TEXT,
      specialties TEXT,
      target_region TEXT,
      reference1_name TEXT,
      reference1_phone TEXT,
      reference1_email TEXT,
      reference2_name TEXT,
      reference2_phone TEXT,
      reference2_email TEXT,
      promo_code TEXT,
      promo_benefits TEXT,
      promo_spot_number INTEGER,
      is_founding_member BOOLEAN DEFAULT FALSE,
      user_type TEXT DEFAULT 'agent',
      status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected', 'under_review')),
      rejection_reason TEXT,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    `CREATE INDEX IF NOT EXISTS idx_agent_vetting_user_id ON agent_vetting(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_agent_vetting_status ON agent_vetting(status)`,
    `ALTER TABLE agent_vetting ENABLE ROW LEVEL SECURITY`,
    
    // Drop existing policies
    `DROP POLICY IF EXISTS "Users can view their own vetting records" ON agent_vetting`,
    `DROP POLICY IF EXISTS "Users can insert their own vetting records" ON agent_vetting`,
    `DROP POLICY IF EXISTS "Admins can view all vetting records" ON agent_vetting`,
    `DROP POLICY IF EXISTS "Admins can update all vetting records" ON agent_vetting`,
    
    // Create RLS policies
    `CREATE POLICY "Users can view their own vetting records" ON agent_vetting FOR SELECT USING (auth.uid() = user_id)`,
    `CREATE POLICY "Users can insert their own vetting records" ON agent_vetting FOR INSERT WITH CHECK (auth.uid() = user_id)`,
    `CREATE POLICY "Admins can view all vetting records" ON agent_vetting FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'))`,
    `CREATE POLICY "Admins can update all vetting records" ON agent_vetting FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin'))`
  ];

  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    console.log(`🔄 Executing statement ${i + 1}/${sqlStatements.length}...`);
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ Error executing statement ${i + 1}:`, error);
      // Continue with other statements
    } else {
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
  }

  console.log('🎉 agent_vetting table setup completed!');
}

setupAgentTable().catch(console.error);