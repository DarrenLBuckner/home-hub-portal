const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkJamaicaStatus() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🇯🇲 CHECKING JAMAICA EXPANSION DATABASE STATUS...\n');

    // Check if Jamaica exists in countries table
    const { data: jamaica, error: countryError } = await supabase
      .from('countries')
      .select('id, name, currency_code, currency_symbol')
      .eq('id', 'JM');

    if (countryError) {
      console.error('❌ Error checking countries:', countryError);
      return;
    }

    console.log('1️⃣ COUNTRIES TABLE:');
    if (jamaica && jamaica.length > 0) {
      console.log(`   ✅ Jamaica exists: ${jamaica[0].name} (${jamaica[0].currency_code})`);
    } else {
      console.log('   ❌ Jamaica NOT found in countries table');
    }

    // Check Jamaica regions
    const { data: jamaicaRegions, error: regionsError } = await supabase
      .from('regions')
      .select('name, country_code')
      .eq('country_code', 'JM');

    console.log('\n2️⃣ JAMAICA REGIONS:');
    if (regionsError) {
      console.error('   ❌ Error checking regions:', regionsError);
    } else {
      console.log(`   📍 Found ${jamaicaRegions?.length || 0} Jamaica regions`);
      if (jamaicaRegions && jamaicaRegions.length > 0) {
        jamaicaRegions.slice(0, 5).forEach(region => {
          console.log(`      - ${region.name}`);
        });
        if (jamaicaRegions.length > 5) {
          console.log(`      ... and ${jamaicaRegions.length - 5} more`);
        }
      }
    }

    // Check Jamaica pricing plans
    const { data: jamaicaPlans, error: plansError } = await supabase
      .from('pricing_plans')
      .select('plan_name, user_type, price, features')
      .like('plan_name', '%Jamaica%');

    console.log('\n3️⃣ JAMAICA PRICING PLANS:');
    if (plansError) {
      console.error('   ❌ Error checking pricing plans:', plansError);
    } else {
      console.log(`   💰 Found ${jamaicaPlans?.length || 0} Jamaica-specific plans`);
      if (jamaicaPlans && jamaicaPlans.length > 0) {
        jamaicaPlans.forEach(plan => {
          const priceJMD = (plan.price / 100).toLocaleString();
          console.log(`      - ${plan.plan_name}: J$${priceJMD} (${plan.user_type})`);
        });
      }
    }

    // Summary status
    const jamaicaExists = jamaica && jamaica.length > 0;
    const regionsExist = jamaicaRegions && jamaicaRegions.length >= 15;
    const plansExist = jamaicaPlans && jamaicaPlans.length >= 7;

    console.log('\n📊 JAMAICA EXPANSION STATUS SUMMARY:');
    console.log(`   Countries Table: ${jamaicaExists ? '✅' : '❌'} Jamaica exists`);
    console.log(`   Regions Data: ${regionsExist ? '✅' : '⚠️'} ${jamaicaRegions?.length || 0}/15 regions (target: 15)`);
    console.log(`   Pricing Plans: ${plansExist ? '✅' : '⚠️'} ${jamaicaPlans?.length || 0}/7 plans (target: 7)`);

    if (jamaicaExists && regionsExist && plansExist) {
      console.log('\n🎉 PHASE 1 COMPLETE: Database configuration successful!');
      console.log('   Ready to proceed to Phase 2: Theme & Branding Setup');
    } else {
      console.log('\n⚠️ PHASE 1 INCOMPLETE: Some database scripts need to be executed');
      console.log('   Refer to: docs/jamaica-expansion/01-DATABASE-SCRIPTS.md');
    }

  } catch (error) {
    console.error('❌ Error checking Jamaica status:', error);
  }
}

checkJamaicaStatus();