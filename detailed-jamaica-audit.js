const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function detailedJamaicaAudit() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 DETAILED JAMAICA DATABASE AUDIT...\n');

    // Get ALL Jamaica pricing plans with timestamps
    const { data: jamaicaPlans, error: plansError } = await supabase
      .from('pricing_plans')
      .select('id, plan_name, user_type, price, created_at, features')
      .like('plan_name', '%Jamaica%')
      .order('created_at, user_type, plan_name');

    if (plansError) {
      console.error('❌ Error fetching Jamaica plans:', plansError);
      return;
    }

    console.log(`📊 FOUND ${jamaicaPlans.length} JAMAICA PLANS:\n`);

    jamaicaPlans.forEach((plan, index) => {
      const priceJMD = (plan.price / 100).toLocaleString();
      const created = new Date(plan.created_at).toLocaleString();
      console.log(`${index + 1}. ${plan.plan_name}`);
      console.log(`   User Type: ${plan.user_type}`);
      console.log(`   Price: J$${priceJMD}`);
      console.log(`   Created: ${created}`);
      console.log(`   Country: ${plan.features?.country || 'Not specified'}`);
      console.log('');
    });

    // Group by user type for summary
    const byUserType = jamaicaPlans.reduce((acc, plan) => {
      if (!acc[plan.user_type]) acc[plan.user_type] = [];
      acc[plan.user_type].push(plan);
      return acc;
    }, {});

    console.log('📋 SUMMARY BY USER TYPE:');
    Object.entries(byUserType).forEach(([type, plans]) => {
      console.log(`   ${type.toUpperCase()}: ${plans.length} plans`);
    });

    console.log('\n🤔 INVESTIGATION:');
    if (jamaicaPlans.length > 2) {
      console.log('   🚨 More than 2 plans found - Agent/Landlord plans exist');
      console.log('   ❓ These may have been created by our Node.js scripts');
      console.log('   📝 You may not have run the manual SQL commands');
    } else {
      console.log('   ✅ Only FSBO plans found - matches your manual SQL execution');
    }

    // Check creation timeline
    if (jamaicaPlans.length > 0) {
      const oldestPlan = jamaicaPlans[0];
      const newestPlan = jamaicaPlans[jamaicaPlans.length - 1];
      
      console.log('\n⏰ CREATION TIMELINE:');
      console.log(`   First plan: ${new Date(oldestPlan.created_at).toLocaleString()}`);
      console.log(`   Last plan: ${new Date(newestPlan.created_at).toLocaleString()}`);
      
      const timeDiff = new Date(newestPlan.created_at) - new Date(oldestPlan.created_at);
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesDiff < 5) {
        console.log(`   🤖 All created within ${minutesDiff} minutes - likely automated script`);
      } else {
        console.log(`   👤 Created over ${minutesDiff} minutes - likely manual execution`);
      }
    }

  } catch (error) {
    console.error('❌ Audit failed:', error);
  }
}

detailedJamaicaAudit();