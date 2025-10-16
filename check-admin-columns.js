const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAdminColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 CHECKING ADMIN-SPECIFIC COLUMNS...\n');

    // Get a sample profile to see the admin columns
    const { data: sampleProfile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, admin_level, admin_country, country_id, email')
      .limit(5);

    if (profileError) {
      console.error('❌ Error:', profileError);
      return;
    }

    console.log('📊 ADMIN COLUMN VALUES:');
    sampleProfile.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.email || 'No email'}`);
      console.log(`      user_type: ${profile.user_type || 'null'}`);
      console.log(`      admin_level: ${profile.admin_level || 'null'}`);
      console.log(`      admin_country: ${profile.admin_country || 'null'}`);
      console.log(`      country_id: ${profile.country_id || 'null'}`);
      console.log('');
    });

    // Check for existing admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('profiles')
      .select('email, user_type, admin_level, admin_country, country_id')
      .eq('user_type', 'admin');

    console.log('👑 CURRENT ADMIN USERS:');
    if (!adminError && adminUsers && adminUsers.length > 0) {
      adminUsers.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email}`);
        console.log(`      admin_level: ${admin.admin_level || 'null'}`);
        console.log(`      admin_country: ${admin.admin_country || 'null'}`);
        console.log(`      country_id: ${admin.country_id || 'null'}`);
        console.log('');
      });
    } else {
      console.log('   No admin users found\n');
    }

    // Check countries table for reference
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('id, name')
      .in('id', ['GY', 'JM']);

    console.log('🌍 AVAILABLE COUNTRIES:');
    if (!countriesError && countries) {
      countries.forEach(country => {
        console.log(`   ${country.id}: ${country.name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAdminColumns();