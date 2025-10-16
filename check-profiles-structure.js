const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkProfilesStructure() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 CHECKING PROFILES TABLE STRUCTURE...\n');

    // Check if we can see any profile structure by getting one record
    const { data: sampleProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.error('❌ Error accessing profiles:', profileError);
      return;
    }

    if (sampleProfile && sampleProfile.length > 0) {
      console.log('📋 PROFILES TABLE COLUMNS:');
      const columns = Object.keys(sampleProfile[0]);
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col}`);
      });

      // Check if country_code exists
      const hasCountryCode = columns.includes('country_code');
      const hasAdminPermissions = columns.includes('admin_permissions');
      
      console.log('\n🔎 ADMIN-RELEVANT COLUMNS:');
      console.log(`   country_code: ${hasCountryCode ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   admin_permissions: ${hasAdminPermissions ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`   user_type: ${columns.includes('user_type') ? '✅ EXISTS' : '❌ MISSING'}`);

      // Check current admin users
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('email, user_type, country_code')
        .eq('user_type', 'admin');

      if (!adminError && adminUsers) {
        console.log('\n👑 CURRENT ADMIN USERS:');
        if (adminUsers.length === 0) {
          console.log('   No admin users found');
        } else {
          adminUsers.forEach((admin, index) => {
            const country = admin.country_code || 'Unknown';
            console.log(`   ${index + 1}. ${admin.email} (${country})`);
          });
        }
      }

    } else {
      console.log('⚠️ No profiles found in table');
    }

  } catch (error) {
    console.error('❌ Error checking profiles structure:', error);
  }
}

checkProfilesStructure();