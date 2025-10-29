#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFeaturingPricesAlignment() {
  console.log('🔍 Verifying Featuring Prices Alignment');
  console.log('📅 Date:', new Date().toISOString().split('T')[0]);
  console.log('=' .repeat(60));
  
  try {
    // Verification 1: Active markets only (Jamaica & Guyana)
    console.log('\n✅ VERIFICATION 1: Active Markets Only');
    const { data: activeMarkets, error: activeError } = await supabase
      .from('featuring_prices')
      .select('site_id, feature_type, is_active')
      .eq('is_active', true)
      .order('site_id, feature_type');
    
    if (activeError) {
      console.error('❌ Error fetching active markets:', activeError);
      throw activeError;
    }

    console.log('\n📊 Active Markets:');
    const activeBysite = {};
    activeMarkets.forEach(row => {
      if (!activeBysite[row.site_id]) activeBysite[row.site_id] = [];
      activeBysite[row.site_id].push(row.feature_type);
    });
    
    Object.keys(activeBysite).sort().forEach(site => {
      const features = activeBysite[site];
      const icon = ['jamaica', 'guyana'].includes(site) ? '🟢' : '🔴';
      console.log(`${icon} ${site}: ${features.length} features (${features.join(', ')})`);
    });

    // Verification 2: Inactive future markets
    console.log('\n❌ VERIFICATION 2: Inactive Future Markets');
    const { data: inactiveMarkets, error: inactiveError } = await supabase
      .from('featuring_prices')
      .select('site_id')
      .eq('is_active', false)
      .order('site_id');
    
    if (inactiveError) {
      console.error('❌ Error fetching inactive markets:', inactiveError);
      throw inactiveError;
    }

    const futureMarkets = ['kenya', 'trinidad', 'south-africa', 'ghana', 'rwanda', 'dominica', 'namibia'];
    console.log('📊 Future Markets (Should be inactive):');
    
    const { data: allInactive, error: allInactiveError } = await supabase
      .from('featuring_prices')
      .select('site_id')
      .eq('is_active', false);
    
    if (allInactiveError) {
      console.error('❌ Error fetching all inactive:', allInactiveError);
      throw allInactiveError;
    }

    const inactiveSites = [...new Set(allInactive.map(row => row.site_id))];
    futureMarkets.forEach(market => {
      const isInactive = inactiveSites.includes(market);
      const icon = isInactive ? '✅' : '❌';
      console.log(`${icon} ${market}: ${isInactive ? 'INACTIVE (correct)' : 'ACTIVE (ERROR!)'}`);
    });

    // Verification 3: Test specific site queries (Jamaica)
    console.log('\n🇯🇲 VERIFICATION 3: Jamaica-Specific Query');
    const { data: jamaicaPrices, error: jamaicaError } = await supabase
      .from('featuring_prices')
      .select('*')
      .eq('site_id', 'jamaica')
      .eq('is_active', true)
      .order('duration_days');
    
    if (jamaicaError) {
      console.error('❌ Error fetching Jamaica prices:', jamaicaError);
      throw jamaicaError;
    }

    console.log(`📋 Jamaica Featuring Prices (${jamaicaPrices.length} active):`);
    jamaicaPrices.forEach(price => {
      console.log(`   • ${price.feature_type}: $${price.price_gyd} GYD for ${price.duration_days} days`);
    });

    // Verification 4: Test specific site queries (Guyana)
    console.log('\n🇬🇾 VERIFICATION 4: Guyana-Specific Query');
    const { data: guyanaPrices, error: guyanaError } = await supabase
      .from('featuring_prices')
      .select('*')
      .eq('site_id', 'guyana')
      .eq('is_active', true)
      .order('duration_days');
    
    if (guyanaError) {
      console.error('❌ Error fetching Guyana prices:', guyanaError);
      throw guyanaError;
    }

    console.log(`📋 Guyana Featuring Prices (${guyanaPrices.length} active):`);
    guyanaPrices.forEach(price => {
      console.log(`   • ${price.feature_type}: $${price.price_gyd} GYD for ${price.duration_days} days`);
    });

    // Verification 5: Test future market query (should return empty with fallback)
    console.log('\n🚫 VERIFICATION 5: Future Market Query (Ghana)');
    const { data: ghanaPrices, error: ghanaError } = await supabase
      .from('featuring_prices')
      .select('*')
      .eq('site_id', 'ghana')
      .eq('is_active', true)
      .order('duration_days');
    
    if (ghanaError) {
      console.error('❌ Error fetching Ghana prices:', ghanaError);
      throw ghanaError;
    }

    console.log(`📋 Ghana Featuring Prices (${ghanaPrices.length} active - should be 0):`);
    if (ghanaPrices.length === 0) {
      console.log('   ✅ Correct: No active prices for Ghana (future market)');
    } else {
      console.log('   ❌ ERROR: Ghana has active prices when it should not!');
      ghanaPrices.forEach(price => {
        console.log(`   • ${price.feature_type}: $${price.price_gyd} GYD for ${price.duration_days} days`);
      });
    }

    // Final Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FINAL VERIFICATION SUMMARY');
    console.log('=' .repeat(60));
    
    const liveMarkets = ['jamaica', 'guyana'];
    const liveMarketsActive = liveMarkets.every(market => 
      activeMarkets.some(row => row.site_id === market)
    );
    
    const futureMarketsInactive = futureMarkets.every(market => 
      inactiveSites.includes(market)
    );
    
    console.log(`✅ Live Markets (JM/GY) Active: ${liveMarketsActive ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Future Markets Inactive: ${futureMarketsInactive ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Jamaica Pricing Available: ${jamaicaPrices.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Guyana Pricing Available: ${guyanaPrices.length > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Ghana Pricing Disabled: ${ghanaPrices.length === 0 ? 'PASS' : 'FAIL'}`);
    
    const allTestsPass = liveMarketsActive && futureMarketsInactive && 
                        jamaicaPrices.length > 0 && guyanaPrices.length > 0 && 
                        ghanaPrices.length === 0;
    
    if (allTestsPass) {
      console.log('\n🎉 ALL VERIFICATIONS PASSED!');
      console.log('✨ Featuring prices are correctly aligned with live markets (JM + GY only)');
    } else {
      console.log('\n❌ SOME VERIFICATIONS FAILED!');
      console.log('🔧 Please review the above results and fix any issues');
    }
    
    console.log('\n📌 Next Steps:');
    console.log('   • Test pricing pages: http://localhost:3000/pricing?site=jamaica');
    console.log('   • Test pricing pages: http://localhost:3000/pricing?site=guyana');
    console.log('   • Test redirect: http://localhost:3000/list?site=jamaica');
    console.log('   • Verify front-site CTAs point to correct Portal URLs');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

// Run the verification
verifyFeaturingPricesAlignment();