// Create email_events table for tracking email bounces and delivery status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEmailEventsTable() {
  console.log('📧 Creating email_events table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Create email_events table
      CREATE TABLE IF NOT EXISTS email_events (
        id SERIAL PRIMARY KEY,
        email_id TEXT,
        recipient TEXT NOT NULL,
        event_type TEXT NOT NULL,
        reason TEXT,
        subject TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        metadata JSONB,
        
        -- Add indexes for better performance
        CONSTRAINT email_events_type_check CHECK (event_type IN (
          'email.bounced', 
          'email.complained', 
          'email.delivery_delayed',
          'email.delivered',
          'email.opened'
        ))
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_email_events_recipient ON email_events(recipient);
      CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);

      -- Create view for failed emails
      CREATE OR REPLACE VIEW failed_emails AS
      SELECT 
        recipient,
        event_type,
        reason,
        subject,
        created_at,
        metadata
      FROM email_events 
      WHERE event_type IN ('email.bounced', 'email.complained', 'email.delivery_delayed')
      ORDER BY created_at DESC;

      -- Create view for email stats
      CREATE OR REPLACE VIEW email_stats AS
      SELECT 
        DATE(created_at) as date,
        event_type,
        COUNT(*) as count
      FROM email_events 
      GROUP BY DATE(created_at), event_type
      ORDER BY date DESC;
    `
  });

  if (error) {
    console.error('❌ Failed to create email_events table:', error);
    process.exit(1);
  }

  console.log('✅ Email events table created successfully!');
  
  // Test the table
  const { data: testData, error: testError } = await supabase
    .from('email_events')
    .select('*')
    .limit(1);

  if (testError) {
    console.error('❌ Table test failed:', testError);
  } else {
    console.log('✅ Table test passed!');
  }
}

createEmailEventsTable();