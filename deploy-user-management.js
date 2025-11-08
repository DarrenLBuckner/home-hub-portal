const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deployUserManagement() {
  console.log('🚀 Deploying user management enhancements...');
  
  const steps = [
    'deploy-user-management-step1.sql',
    'deploy-user-management-step2.sql', 
    'deploy-user-management-step3.sql',
    'deploy-user-management-step4.sql',
    'deploy-user-management-step5.sql',
    'deploy-user-management-step6.sql',
    'deploy-user-management-step7.sql'
  ];
  
  for (let i = 0; i < steps.length; i++) {
    const stepFile = steps[i];
    console.log(`\n📋 Step ${i + 1}: ${stepFile}`);
    
    try {
      const sql = fs.readFileSync(stepFile, 'utf8').trim();
      console.log('SQL:', sql.substring(0, 100) + '...');
      
      // Use the direct query method instead of rpc
      const { data, error } = await supabase.from('_sql_runner').select('*').limit(0);
      
      if (error) {
        console.log('⚠️  Cannot use direct SQL execution via API');
        console.log('📝 Please run this SQL manually in Supabase SQL Editor:');
        console.log('---BEGIN SQL---');
        console.log(sql);
        console.log('---END SQL---\n');
      }
      
    } catch (error) {
      console.error(`❌ Error in step ${i + 1}:`, error.message);
    }
  }
  
  console.log('\n✅ Deployment guide complete!');
  console.log('📖 Instructions:');
  console.log('1. Go to your Supabase Dashboard > SQL Editor');
  console.log('2. Copy and paste each step file content above');
  console.log('3. Run each step in order');
  console.log('4. Test with: SELECT generate_account_code(\'GY\');');
}

deployUserManagement();