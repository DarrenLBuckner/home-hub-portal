const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function insertJamaicaFSBOPlans() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🇯🇲 INSERTING JAMAICA FSBO PRICING PLANS...\n');

    // FSBO Plans for Jamaica
    const jamaicaFSBOPlans = [
      {
        user_type: 'fsbo',
        plan_name: 'FSBO Basic Listing - Jamaica',
        plan_type: 'per_property',
        price: 1500000, // J$15,000 (≈$95 USD)
        max_properties: 1,
        featured_listings_included: 0,
        listing_duration_days: 90,
        is_active: true,
        is_popular: false,
        display_order: 1,
        features: {
          support: "email",
          duration: "90 days",
          basic_analytics: true,
          country: "JM"
        }
      },
      {
        user_type: 'fsbo',
        plan_name: 'FSBO Premium Listing - Jamaica',
        plan_type: 'per_property',
        price: 3000000, // J$30,000 (≈$190 USD)
        max_properties: 1,
        featured_listings_included: 1,
        listing_duration_days: 90,
        is_active: true,
        is_popular: true,
        display_order: 2,
        features: {
          support: "priority",
          duration: "90 days",
          social_sharing: true,
          advanced_analytics: true,
          country: "JM"
        }
      }
    ];

    const { data: insertedPlans, error: insertError } = await supabase
      .from('pricing_plans')
      .insert(jamaicaFSBOPlans)
      .select();

    if (insertError) {
      console.error('❌ Error inserting Jamaica FSBO plans:', insertError);
      return;
    }

    console.log('✅ SUCCESS: Jamaica FSBO plans inserted!');
    console.log(`   📊 Added ${insertedPlans.length} plans:\n`);

    insertedPlans.forEach((plan, index) => {
      const priceJMD = (plan.price / 100).toLocaleString();
      console.log(`   ${index + 1}. ${plan.plan_name}`);
      console.log(`      💰 J$${priceJMD}`);
      console.log(`      📅 ${plan.listing_duration_days} days`);
      console.log(`      ⭐ ${plan.is_popular ? 'Popular' : 'Standard'}`);
      console.log('');
    });

    // Verify total Jamaica plans now
    const { data: allJamaicaPlans, error: verifyError } = await supabase
      .from('pricing_plans')
      .select('plan_name, user_type')
      .like('plan_name', '%Jamaica%');

    if (!verifyError) {
      console.log(`🎯 TOTAL JAMAICA PLANS: ${allJamaicaPlans.length}/7 (target)`);
      console.log('   Next: Add Agent and Landlord plans to complete Phase 1');
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

insertJamaicaFSBOPlans();