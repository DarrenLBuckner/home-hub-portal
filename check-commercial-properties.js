const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCommercialProperties() {
  console.log('🔍 Checking commercial properties in database...\n');
  
  // Check all commercial properties
  const { data: allCommercial, error } = await supabase
    .from('properties')
    .select('id, title, property_category, listing_type, status, location, site_id')
    .eq('property_category', 'commercial')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.log('❌ Error:', error);
    return;
  }
  
  console.log(`📊 Total commercial properties found: ${allCommercial?.length || 0}`);
  
  if (allCommercial && allCommercial.length > 0) {
    console.log('\n📋 All Commercial Properties:');
    allCommercial.forEach((p, i) => {
      console.log(`${i + 1}. ${p.title}`);
      console.log(`   - Type: ${p.listing_type}`);
      console.log(`   - Status: ${p.status}`);
      console.log(`   - Site: ${p.site_id}`);
      console.log(`   - Location: ${p.location}`);
      console.log('');
    });

    // Check active commercial properties for sale
    const activeSale = allCommercial.filter(p => p.status === 'active' && p.listing_type === 'sale');
    console.log(`🏢 Active Commercial Properties for SALE: ${activeSale.length}`);
    activeSale.forEach(p => console.log(`  - ${p.title} (${p.location})`));

    // Check active commercial properties for lease
    const activeLease = allCommercial.filter(p => p.status === 'active' && p.listing_type === 'lease');
    console.log(`🏢 Active Commercial Properties for LEASE: ${activeLease.length}`);
    activeLease.forEach(p => console.log(`  - ${p.title} (${p.location})`));

    // Check active commercial properties for rent 
    const activeRent = allCommercial.filter(p => p.status === 'active' && p.listing_type === 'rent');
    console.log(`🏢 Active Commercial Properties for RENT: ${activeRent.length}`);
    activeRent.forEach(p => console.log(`  - ${p.title} (${p.location})`));
  }
}

checkCommercialProperties().then(() => {
  console.log('✅ Check complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});