const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkPricing() {
  try {
    console.log('🔍 Checking pricing configuration in database...');
    
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check pricing_plans table
    const { data: pricingPlans, error: pricingError } = await supabase
      .from('pricing_plans')
      .select('*')
      .order('user_type', { ascending: true })
      .order('price', { ascending: true });
    
    if (pricingError) {
      console.error('Error fetching pricing plans:', pricingError);
      return;
    }
    
    console.log('\n📊 PRICING PLANS IN DATABASE:');
    console.log('==============================');
    console.log(`Total plans: ${pricingPlans?.length || 0}`);
    
    if (pricingPlans && pricingPlans.length > 0) {
      pricingPlans.forEach((plan, index) => {
        console.log(`\n${index + 1}. ${plan.plan_name} (${plan.user_type})`);
        console.log(`   - ID: ${plan.id}`);
        console.log(`   - Price: $${(plan.price / 100).toFixed(2)} USD`);
        console.log(`   - Plan Type: ${plan.plan_type}`);
        console.log(`   - Max Properties: ${plan.max_properties || 'Unlimited'}`);
        console.log(`   - Featured Listings: ${plan.featured_listings_included}`);
        console.log(`   - Duration: ${plan.listing_duration_days} days`);
        console.log(`   - Active: ${plan.is_active ? 'Yes' : 'No'}`);
        console.log(`   - Popular: ${plan.is_popular ? 'Yes' : 'No'}`);
        console.log(`   - Country: ${plan.country_id || 'Not specified'}`);
        console.log(`   - Features: ${JSON.stringify(plan.features) || 'None'}`);
      });
    } else {
      console.log('No pricing plans found in database.');
    }
    
    // Check by user type
    const userTypes = ['fsbo', 'agent', 'landlord'];
    
    console.log('\n📈 PRICING BY USER TYPE:');
    console.log('========================');
    
    for (const userType of userTypes) {
      const plans = pricingPlans?.filter(p => p.user_type === userType) || [];
      console.log(`\n${userType.toUpperCase()}:`);
      console.log(`- Plans available: ${plans.length}`);
      if (plans.length > 0) {
        plans.forEach(plan => {
          console.log(`  • ${plan.plan_name}: $${(plan.price / 100).toFixed(2)} (${plan.is_active ? 'Active' : 'Inactive'})`);
        });
      } else {
        console.log(`  • No plans found for ${userType}`);
      }
    }
    
    // Check admin_pricing_overview (if exists)
    try {
      const { data: overviewData, error: overviewError } = await supabase
        .from('admin_pricing_overview')
        .select('*')
        .limit(1);
      
      if (!overviewError && overviewData) {
        console.log('\n📊 ADMIN PRICING OVERVIEW TABLE EXISTS');
        console.log('=====================================');
        console.log('This table is used by the admin pricing management interface.');
      } else {
        console.log('\n⚠️  ADMIN PRICING OVERVIEW TABLE NOT FOUND');
        console.log('The admin interface may not work properly.');
      }
    } catch (e) {
      console.log('\n⚠️  Could not check admin_pricing_overview table');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the script
checkPricing()
  .then(() => {
    console.log('\n✅ Pricing check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });