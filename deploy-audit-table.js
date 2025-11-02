const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployAuditTable() {
  try {
    console.log('🚀 Starting audit table deployment...');
    
    // Read the SQL file
    const sqlContent = fs.readFileSync('create-admin-audit-table.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\n⏳ Executing statement ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        if (!error.message.includes('already exists')) {
          throw error;
        } else {
          console.log('⚠️  Object already exists, continuing...');
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('\n🎉 Audit table deployment completed successfully!');
    
    // Test that the table exists
    const { data: tables, error: testError } = await supabase
      .from('admin_property_limit_updates')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing table access:', testError);
    } else {
      console.log('✅ Audit table is accessible and ready for use');
    }
    
  } catch (error) {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  }
}

deployAuditTable();