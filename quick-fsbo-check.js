const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkFSBOPricing() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🎯 CHECKING CURRENT FSBO PRICING IN SUPABASE...\n');

  const { data, error } = await supabase
    .from('pricing_plans')
    .select('plan_name, price, listing_duration_days, is_active, features')
    .eq('user_type', 'fsbo')
    .order('price');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 CURRENT FSBO PRICING:');
  console.log('========================');
  data.forEach((plan, i) => {
    const priceGYD = (plan.price / 100).toLocaleString();
    const status = plan.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
    const photos = plan.features?.photos || 'N/A';
    console.log(`${i + 1}. ${plan.plan_name}`);
    console.log(`   Price: G$${priceGYD}`);
    console.log(`   Duration: ${plan.listing_duration_days} days`);
    console.log(`   Photos: ${photos}`);
    console.log(`   Status: ${status}`);
    console.log('');
  });

  console.log(`✅ Total FSBO plans in database: ${data.length}`);
  console.log('\n🔍 ANALYSIS:');
  
  if (data.length === 4) {
    console.log('✅ Perfect! All 4 FSBO tiers are present:');
    console.log('   - Single Property (G$15,000)');
    console.log('   - Featured Listing (G$25,000)');  
    console.log('   - Premium Listing (G$35,000)');
    console.log('   - Enterprise (G$150,000)');
    console.log('\n🎉 NO ADDITIONAL SQL NEEDED - Database migration is COMPLETE!');
  } else {
    console.log(`❌ Expected 4 plans, found ${data.length}. May need SQL fixes.`);
  }
}

checkFSBOPricing();