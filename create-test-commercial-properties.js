const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestCommercialProperties() {
  console.log('🏢 Creating test commercial properties...\n');

  const testProperties = [
    {
      title: 'Modern Office Space for Lease - Georgetown',
      description: 'Prime commercial office space in Georgetown business district. Perfect for corporate headquarters.',
      property_category: 'commercial',
      commercial_type: 'office',
      listing_type: 'lease',
      price: 5000,
      currency: 'USD',
      location: 'Georgetown, Guyana',
      bedrooms: null,
      bathrooms: 2,
      floor_size_sqft: 2500,
      lease_term_years: 3,
      lease_type: 'triple_net',
      financing_available: false,
      status: 'active',
      site_id: 'guyana'
    },
    {
      title: 'Retail Space for Rent - Main Street',
      description: 'High-traffic retail location perfect for shops, restaurants, or services.',
      property_category: 'commercial',
      commercial_type: 'retail',
      listing_type: 'rent',
      price: 3500,
      currency: 'USD',
      location: 'Georgetown, Guyana',
      bedrooms: null,
      bathrooms: 1,
      floor_size_sqft: 1800,
      lease_term_years: 2,
      lease_type: 'gross',
      financing_available: false,
      status: 'active',
      site_id: 'guyana',
      agent_id: '70283da9-28c5-4dfb-ab43-b6086e5c3a16'
    },
    {
      title: 'Commercial Building for Sale - Investment Opportunity',
      description: 'Excellent investment opportunity. Multi-tenant commercial building with stable rental income.',
      property_category: 'commercial',
      commercial_type: 'mixed_use',
      listing_type: 'sale',
      price: 450000,
      currency: 'USD',
      location: 'Georgetown, Guyana',
      bedrooms: null,
      bathrooms: 4,
      floor_size_sqft: 5000,
      lease_term_years: null,
      lease_type: null,
      financing_available: true,
      financing_details: 'Bank financing available with 20% down payment. Owner financing also considered.',
      status: 'active',
      site_id: 'guyana'
    },
    {
      title: 'Warehouse for Lease - Industrial Area',
      description: 'Large warehouse space perfect for storage, distribution, or light manufacturing.',
      property_category: 'commercial',
      commercial_type: 'industrial',
      listing_type: 'lease',
      price: 4200,
      currency: 'USD',
      location: 'Georgetown, Guyana',
      bedrooms: null,
      bathrooms: 2,
      floor_size_sqft: 8000,
      lease_term_years: 5,
      lease_type: 'modified_gross',
      financing_available: false,
      status: 'active',
      site_id: 'guyana'
    }
  ];

  for (const property of testProperties) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert(property)
        .select('id, title, listing_type')
        .single();

      if (error) {
        console.error(`❌ Error creating ${property.title}:`, error);
      } else {
        console.log(`✅ Created: ${data.title} (${data.listing_type}) - ID: ${data.id}`);
      }
    } catch (err) {
      console.error(`❌ Exception creating ${property.title}:`, err);
    }
  }

  console.log('\n🔍 Verifying created properties...');
  
  // Verify the properties were created
  const { data: commercial, error } = await supabase
    .from('properties')
    .select('id, title, property_category, listing_type, status')
    .eq('property_category', 'commercial')
    .eq('status', 'active');

  if (error) {
    console.error('❌ Error fetching commercial properties:', error);
  } else {
    console.log(`\n📊 Total active commercial properties: ${commercial.length}`);
    
    const forSale = commercial.filter(p => p.listing_type === 'sale');
    const forLease = commercial.filter(p => p.listing_type === 'lease');
    const forRent = commercial.filter(p => p.listing_type === 'rent');
    
    console.log(`🏢 For Sale: ${forSale.length}`);
    forSale.forEach(p => console.log(`  - ${p.title}`));
    
    console.log(`🏢 For Lease: ${forLease.length}`);
    forLease.forEach(p => console.log(`  - ${p.title}`));
    
    console.log(`🏢 For Rent: ${forRent.length}`);
    forRent.forEach(p => console.log(`  - ${p.title}`));
  }
}

createTestCommercialProperties().then(() => {
  console.log('\n✅ Test properties creation complete');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});