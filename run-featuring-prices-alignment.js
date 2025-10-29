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

async function alignFeaturingPrices() {
  console.log('🎯 Aligning Featuring Prices with Live Markets (JM + GY Only)');
  console.log('📅 Date:', new Date().toISOString().split('T')[0]);
  
  try {
    // Step 1: Activate Jamaica & Guyana
    console.log('\n📍 Step 1: Activating Jamaica & Guyana...');
    const { error: activateError } = await supabase
      .from('featuring_prices')
      .update({ is_active: true })
      .in('site_id', ['jamaica', 'guyana']);
    
    if (activateError) {
      console.error('❌ Error activating JM/GY:', activateError);
      throw activateError;
    }
    console.log('✅ Jamaica & Guyana activated successfully');

    // Step 2: Deactivate future markets
    console.log('\n📍 Step 2: Deactivating future markets...');
    const futureMarkets = ['kenya', 'trinidad', 'south-africa', 'ghana', 'rwanda', 'dominica', 'namibia'];
    const { error: deactivateError } = await supabase
      .from('featuring_prices')
      .update({ is_active: false })
      .in('site_id', futureMarkets);
    
    if (deactivateError) {
      console.error('❌ Error deactivating future markets:', deactivateError);
      throw deactivateError;
    }
    console.log('✅ Future markets deactivated successfully');

    // Step 3: Sanity check - count active/inactive by site
    console.log('\n📍 Step 3: Verification - Active/Inactive counts by site:');
    const { data: counts, error: countError } = await supabase
      .from('featuring_prices')
      .select('site_id, is_active')
      .order('site_id');
    
    if (countError) {
      console.error('❌ Error getting counts:', countError);
      throw countError;
    }

    // Group and count
    const siteCounts = {};
    counts.forEach(row => {
      if (!siteCounts[row.site_id]) {
        siteCounts[row.site_id] = { active: 0, total: 0 };
      }
      siteCounts[row.site_id].total++;
      if (row.is_active) {
        siteCounts[row.site_id].active++;
      }
    });

    console.log('\n📊 Results:');
    console.log('Site ID'.padEnd(15) + 'Active'.padEnd(8) + 'Total'.padEnd(8) + 'Status');
    console.log('-'.repeat(40));
    
    Object.keys(siteCounts).sort().forEach(siteId => {
      const { active, total } = siteCounts[siteId];
      const status = ['jamaica', 'guyana'].includes(siteId) ? '🟢 LIVE' : '🔴 FUTURE';
      console.log(
        siteId.padEnd(15) + 
        active.toString().padEnd(8) + 
        total.toString().padEnd(8) + 
        status
      );
    });

    // Step 4: Show detailed featuring prices
    console.log('\n📋 Detailed Featuring Prices:');
    const { data: allPrices, error: pricesError } = await supabase
      .from('featuring_prices')
      .select('site_id, feature_type, is_active, price_gyd, duration_days')
      .order('site_id, feature_type, duration_days');
    
    if (pricesError) {
      console.error('❌ Error getting detailed prices:', pricesError);
      throw pricesError;
    }

    console.log('\nSite'.padEnd(12) + 'Feature'.padEnd(12) + 'Active'.padEnd(8) + 'Price (GYD)'.padEnd(12) + 'Days');
    console.log('-'.repeat(55));
    
    allPrices.forEach(row => {
      const activeIcon = row.is_active ? '✅' : '❌';
      console.log(
        row.site_id.padEnd(12) + 
        row.feature_type.padEnd(12) + 
        (activeIcon + ' ' + row.is_active).padEnd(8) + 
        (row.price_gyd ? `$${row.price_gyd}` : 'N/A').padEnd(12) + 
        (row.duration_days || 'N/A')
      );
    });

    console.log('\n🎉 Featuring prices alignment completed successfully!');
    console.log('📌 Next steps:');
    console.log('   1. Update Portal pricing queries to filter by is_active=true');
    console.log('   2. Verify front-site redirect routes');
    console.log('   3. Test pricing pages for Jamaica and Guyana');
    
  } catch (error) {
    console.error('❌ Failed to align featuring prices:', error);
    process.exit(1);
  }
}

// Run the alignment
alignFeaturingPrices();