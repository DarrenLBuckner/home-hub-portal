const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkProperties() {
  try {
    console.log('🔍 Checking properties in database...');
    
    // Create admin Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Check all properties
    const { data: allProperties, error: allError } = await supabase
      .from('properties')
      .select('id, title, listing_type, listed_by_type, status, created_at')
      .order('created_at', { ascending: false });
    
    if (allError) {
      console.error('Error fetching properties:', allError);
      return;
    }
    
    console.log('\n📊 ALL PROPERTIES:');
    console.log('==================');
    console.log(`Total properties: ${allProperties.length}`);
    
    if (allProperties.length > 0) {
      allProperties.forEach((prop, index) => {
        console.log(`${index + 1}. ${prop.title}`);
        console.log(`   - Type: ${prop.listing_type} | Listed by: ${prop.listed_by_type} | Status: ${prop.status}`);
        console.log(`   - ID: ${prop.id} | Created: ${prop.created_at}`);
        console.log('');
      });
    } else {
      console.log('No properties found in database.');
    }
    
    // Check test properties specifically
    const { data: testProperties, error: testError } = await supabase
      .from('properties')
      .select('id, title, listing_type, listed_by_type, status, created_at')
      .ilike('title', '%test%');
    
    if (testError) {
      console.error('Error fetching test properties:', testError);
      return;
    }
    
    console.log('\n🧪 TEST PROPERTIES:');
    console.log('==================');
    console.log(`Test properties found: ${testProperties.length}`);
    
    if (testProperties.length > 0) {
      testProperties.forEach((prop, index) => {
        console.log(`${index + 1}. ${prop.title}`);
        console.log(`   - Type: ${prop.listing_type} | Listed by: ${prop.listed_by_type} | Status: ${prop.status}`);
        console.log(`   - ID: ${prop.id} | Created: ${prop.created_at}`);
        console.log('');
      });
    } else {
      console.log('No test properties found.');
    }
    
    // Check by status
    const { data: activeProperties, error: activeError } = await supabase
      .from('properties')
      .select('id, title, listing_type, listed_by_type, status')
      .eq('status', 'active');
    
    const { data: pendingProperties, error: pendingError } = await supabase
      .from('properties')
      .select('id, title, listing_type, listed_by_type, status')
      .eq('status', 'pending');
    
    console.log('\n📈 STATUS SUMMARY:');
    console.log('==================');
    console.log(`Active properties: ${activeProperties?.length || 0}`);
    console.log(`Pending properties: ${pendingProperties?.length || 0}`);
    
    // Check profiles 
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, user_type, first_name, last_name')
      .order('created_at', { ascending: false });
    
    if (!profileError && profiles) {
      console.log('\n👥 USER PROFILES:');
      console.log('=================');
      console.log(`Total users: ${profiles.length}`);
      
      const userTypes = profiles.reduce((acc, profile) => {
        acc[profile.user_type] = (acc[profile.user_type] || 0) + 1;
        return acc;
      }, {});
      
      Object.entries(userTypes).forEach(([type, count]) => {
        console.log(`${type}: ${count}`);
      });
      
      // Show test users
      const testUsers = profiles.filter(p => p.email && p.email.includes('test'));
      if (testUsers.length > 0) {
        console.log('\n🧪 TEST USERS:');
        testUsers.forEach(user => {
          console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ${user.user_type}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run the script
checkProperties()
  .then(() => {
    console.log('\n✅ Property check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Script failed:', error.message);
    process.exit(1);
  });