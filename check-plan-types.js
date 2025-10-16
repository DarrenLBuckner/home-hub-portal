const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkPlanTypes() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 Checking existing plan_type values...');
    
    // Get all unique plan types to understand the constraint
    const { data: allPlans, error } = await supabase
      .from('pricing_plans')
      .select('plan_type, plan_name, user_type');
    
    if (error) {
      console.error('Error:', error);
      return;
    }

    const planTypes = [...new Set(allPlans.map(plan => plan.plan_type))];
    console.log('🎯 Valid plan_type values:');
    planTypes.forEach(type => {
      console.log(`  - ${type}`);
    });

    console.log('\n📊 Plan types by user:');
    const typesByUser = {};
    allPlans.forEach(plan => {
      if (!typesByUser[plan.user_type]) {
        typesByUser[plan.user_type] = [];
      }
      if (!typesByUser[plan.user_type].includes(plan.plan_type)) {
        typesByUser[plan.user_type].push(plan.plan_type);
      }
    });

    Object.keys(typesByUser).forEach(userType => {
      console.log(`  ${userType}: ${typesByUser[userType].join(', ')}`);
    });

  } catch (error) {
    console.error('Failed to check plan types:', error);
  }
}

checkPlanTypes();