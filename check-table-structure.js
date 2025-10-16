const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTableStructure() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 Checking pricing_plans table structure...');
    
    // Get a sample record to see the actual structure
    const { data: samplePlan, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }

    if (samplePlan && samplePlan.length > 0) {
      console.log('📊 Sample pricing plan structure:');
      console.log(JSON.stringify(samplePlan[0], null, 2));
      
      console.log('\n🔑 Available columns:');
      Object.keys(samplePlan[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof samplePlan[0][key]}`);
      });
    }
    
    // Also check all FSBO plans to understand the current format
    const { data: fsboPlans, error: fsboError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('user_type', 'fsbo');
      
    if (!fsboError) {
      console.log('\n📋 Current FSBO plans format:');
      fsboPlans.forEach((plan, index) => {
        console.log(`${index + 1}. Plan: ${plan.plan_name}`);
        console.log(`   Price: ${plan.price} cents = $${(plan.price / 100).toFixed(2)}`);
        console.log(`   Features:`, plan.features);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Failed to check table structure:', error);
  }
}

checkTableStructure();