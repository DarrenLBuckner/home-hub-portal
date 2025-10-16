const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createJamaicaAdmin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🇯🇲 CREATING JAMAICA ADMIN ACCOUNT...\n');

    // Check if Jamaica admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('profiles')
      .select('email, user_type, admin_level, country_id')
      .eq('country_id', 'JM')
      .eq('user_type', 'admin');

    if (checkError) {
      console.error('❌ Error checking existing admins:', checkError);
      return;
    }

    if (existingAdmin && existingAdmin.length > 0) {
      console.log('⚠️ Jamaica admin already exists:');
      existingAdmin.forEach(admin => {
        console.log(`   ${admin.email} (${admin.admin_level})`);
      });
      console.log('\nSkipping creation...');
      return;
    }

    // Create Jamaica admin profile
    // Note: In a real scenario, this would be done through the registration flow
    // followed by manual profile updates. For testing, we're creating directly.
    
    const jamaicaAdminData = {
      email: 'jamaica.admin@jamaicahomehub.com',
      first_name: 'Jamaica',
      last_name: 'Administrator',
      user_type: 'admin',
      admin_level: 'super',
      country_id: 'JM',
      admin_country: 'JM',
      approval_status: 'approved',
      subscription_status: 'active',
      display_name: 'Jamaica Admin',
      admin_notes: 'Jamaica expansion admin account - Phase 5 setup'
    };

    console.log('📝 Creating Jamaica admin profile...');
    const { data: newAdmin, error: createError } = await supabase
      .from('profiles')
      .insert([jamaicaAdminData])
      .select();

    if (createError) {
      console.error('❌ Error creating Jamaica admin:', createError);
      return;
    }

    console.log('✅ Jamaica admin created successfully!');
    console.log(`   Email: ${newAdmin[0].email}`);
    console.log(`   Level: ${newAdmin[0].admin_level}`);
    console.log(`   Country: ${newAdmin[0].country_id}`);
    console.log(`   ID: ${newAdmin[0].id}`);

    // Verify admin creation and country isolation
    console.log('\n🔍 VERIFYING ADMIN SETUP...');
    
    // Check all admins by country
    const { data: allAdmins, error: verifyError } = await supabase
      .from('profiles')
      .select('email, admin_level, country_id')
      .eq('user_type', 'admin')
      .order('country_id, email');

    if (!verifyError && allAdmins) {
      console.log('\n👑 ALL ADMIN USERS BY COUNTRY:');
      
      const guyanaAdmins = allAdmins.filter(a => a.country_id === 'GY');
      const jamaicaAdmins = allAdmins.filter(a => a.country_id === 'JM');
      
      console.log('\n🇬🇾 GUYANA ADMINS:');
      guyanaAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.admin_level})`);
      });
      
      console.log('\n🇯🇲 JAMAICA ADMINS:');
      jamaicaAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.admin_level})`);
      });
      
      console.log('\n📊 ADMIN SUMMARY:');
      console.log(`   Guyana Admins: ${guyanaAdmins.length}`);
      console.log(`   Jamaica Admins: ${jamaicaAdmins.length}`);
      console.log(`   Total Admins: ${allAdmins.length}`);
    }

    console.log('\n🎉 JAMAICA ADMIN SETUP COMPLETE!');
    console.log('   ✅ Jamaica admin account created');
    console.log('   ✅ Country isolation configured');
    console.log('   ✅ Admin permissions set');
    console.log('\n📧 IMPORTANT: Set up authentication for jamaica.admin@jamaicahomehub.com');
    console.log('   This profile exists but needs Supabase Auth account creation');

  } catch (error) {
    console.error('❌ Admin creation failed:', error);
  }
}

createJamaicaAdmin();