const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function insertJamaicaRemainingPlans() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🇯🇲 INSERTING REMAINING JAMAICA PRICING PLANS...\n');

    // Agent Plans for Jamaica
    const jamaicaAgentPlans = [
      {
        user_type: 'agent',
        plan_name: 'Agent Basic Monthly - Jamaica',
        plan_type: 'monthly',
        price: 1500000, // J$15,000/month (≈$95 USD)
        max_properties: 25,
        featured_listings_included: 2,
        listing_duration_days: 30,
        is_active: true,
        is_popular: false,
        display_order: 1,
        features: {
          support: "email",
          analytics: "basic",
          commission_tracking: true,
          country: "JM"
        }
      },
      {
        user_type: 'agent',
        plan_name: 'Agent Pro Monthly - Jamaica',
        plan_type: 'monthly',
        price: 3000000, // J$30,000/month (≈$190 USD)
        max_properties: 100,
        featured_listings_included: 10,
        listing_duration_days: 30,
        is_active: true,
        is_popular: true,
        display_order: 2,
        features: {
          support: "priority",
          analytics: "advanced",
          verified_badge: true,
          commission_tracking: true,
          country: "JM"
        }
      },
      {
        user_type: 'agent',
        plan_name: 'Agent Enterprise Yearly - Jamaica',
        plan_type: 'yearly',
        price: 30000000, // J$300,000/year (≈$1900 USD)
        max_properties: null, // unlimited
        featured_listings_included: 50,
        listing_duration_days: 365,
        is_active: true,
        is_popular: false,
        display_order: 3,
        features: {
          support: "phone",
          analytics: "premium",
          verified_badge: true,
          custom_branding: true,
          commission_tracking: true,
          country: "JM"
        }
      }
    ];

    // Landlord Plans for Jamaica  
    const jamaicaLandlordPlans = [
      {
        user_type: 'landlord',
        plan_name: 'Landlord Basic Rental - Jamaica',
        plan_type: 'per_property',
        price: 1200000, // J$12,000 (≈$76 USD)
        max_properties: 1,
        featured_listings_included: 0,
        listing_duration_days: 60,
        is_active: true,
        is_popular: false,
        display_order: 1,
        features: {
          duration: "60 days",
          rental_tools: true,
          tenant_screening: false,
          country: "JM"
        }
      },
      {
        user_type: 'landlord',
        plan_name: 'Landlord Pro Rental - Jamaica',
        plan_type: 'per_property',
        price: 2200000, // J$22,000 (≈$139 USD)
        max_properties: 1,
        featured_listings_included: 1,
        listing_duration_days: 60,
        is_active: true,
        is_popular: true,
        display_order: 2,
        features: {
          duration: "60 days",
          rental_tools: true,
          lease_templates: true,
          tenant_screening: true,
          country: "JM"
        }
      }
    ];

    // Insert Agent Plans
    console.log('1️⃣ Inserting Agent plans...');
    const { data: agentPlans, error: agentError } = await supabase
      .from('pricing_plans')
      .insert(jamaicaAgentPlans)
      .select();

    if (agentError) {
      console.error('❌ Error inserting Agent plans:', agentError);
      return;
    }

    console.log(`   ✅ Added ${agentPlans.length} Agent plans`);

    // Insert Landlord Plans
    console.log('2️⃣ Inserting Landlord plans...');
    const { data: landlordPlans, error: landlordError } = await supabase
      .from('pricing_plans')
      .insert(jamaicaLandlordPlans)
      .select();

    if (landlordError) {
      console.error('❌ Error inserting Landlord plans:', landlordError);
      return;
    }

    console.log(`   ✅ Added ${landlordPlans.length} Landlord plans`);

    // Final verification
    const { data: allJamaicaPlans, error: verifyError } = await supabase
      .from('pricing_plans')
      .select('plan_name, user_type, price')
      .like('plan_name', '%Jamaica%')
      .order('user_type, display_order');

    if (verifyError) {
      console.error('❌ Error verifying plans:', verifyError);
      return;
    }

    console.log('\n🎉 PHASE 1 COMPLETE: ALL JAMAICA PRICING PLANS ADDED!');
    console.log(`   📊 Total plans: ${allJamaicaPlans.length}/7\n`);

    // Group by user type for summary
    const groupedPlans = allJamaicaPlans.reduce((acc, plan) => {
      if (!acc[plan.user_type]) acc[plan.user_type] = [];
      acc[plan.user_type].push(plan);
      return acc;
    }, {});

    Object.entries(groupedPlans).forEach(([userType, plans]) => {
      console.log(`   ${userType.toUpperCase()}: ${plans.length} plans`);
      plans.forEach(plan => {
        const priceJMD = (plan.price / 100).toLocaleString();
        console.log(`      - ${plan.plan_name}: J$${priceJMD}`);
      });
      console.log('');
    });

    console.log('🚀 READY FOR PHASE 2: Theme & Branding Setup');
    console.log('   Next: Update docs/jamaica-expansion/PROGRESS-TRACKER.md');

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

insertJamaicaRemainingPlans();