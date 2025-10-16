const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function makeDarrenJamaicaAdmin() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('👑 MAKING DARREN JAMAICA SUPER ADMIN...\n');

    // Check current status
    const { data: darrenProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, user_type, admin_level, country_id')
      .eq('email', 'mrdarrenbuckner@gmail.com')
      .single();

    if (checkError) {
      console.error('❌ Error finding Darren profile:', checkError);
      return;
    }

    console.log('📋 CURRENT PROFILE:');
    console.log(`   Email: ${darrenProfile.email}`);
    console.log(`   User Type: ${darrenProfile.user_type}`);
    console.log(`   Admin Level: ${darrenProfile.admin_level}`);
    console.log(`   Country: ${darrenProfile.country_id}`);

    // Create a duplicate Jamaica admin profile for Darren
    // This allows dual-country admin access
    const jamaicaAdminData = {
      email: 'mrdarrenbuckner+jamaica@gmail.com', // Unique email for Jamaica
      first_name: 'Darren',
      last_name: 'Buckner',
      user_type: 'admin',
      admin_level: 'super',
      country_id: 'JM',
      admin_country: 'JM',
      approval_status: 'approved',
      subscription_status: 'active',
      display_name: 'Darren Buckner (Jamaica)',
      admin_notes: 'Jamaica expansion super admin - Phase 5/7 setup'
    };

    console.log('\n🇯🇲 CREATING JAMAICA ADMIN PROFILE...');
    const { data: jamaicaAdmin, error: createError } = await supabase
      .from('profiles')
      .insert([jamaicaAdminData])
      .select();

    if (createError) {
      // If already exists, update instead
      if (createError.code === '23505') {
        console.log('⚠️ Jamaica admin already exists, updating...');
        
        const { data: updatedAdmin, error: updateError } = await supabase
          .from('profiles')
          .update({
            user_type: 'admin',
            admin_level: 'super',
            country_id: 'JM',
            admin_country: 'JM',
            approval_status: 'approved'
          })
          .eq('email', 'mrdarrenbuckner+jamaica@gmail.com')
          .select();

        if (updateError) {
          console.error('❌ Error updating Jamaica admin:', updateError);
          return;
        }
        console.log('✅ Jamaica admin updated successfully!');
      } else {
        console.error('❌ Error creating Jamaica admin:', createError);
        return;
      }
    } else {
      console.log('✅ Jamaica admin created successfully!');
    }

    // Verify admin setup
    console.log('\n🔍 VERIFYING ADMIN SETUP...');
    const { data: allAdmins, error: verifyError } = await supabase
      .from('profiles')
      .select('email, admin_level, country_id, user_type')
      .eq('user_type', 'admin')
      .order('country_id, email');

    if (!verifyError && allAdmins) {
      const guyanaAdmins = allAdmins.filter(a => a.country_id === 'GY');
      const jamaicaAdmins = allAdmins.filter(a => a.country_id === 'JM');
      
      console.log('\n👑 ADMIN USERS BY COUNTRY:');
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
      console.log('   ✅ Dual-country admin access configured');
    }

    console.log('\n🎉 DARREN JAMAICA ADMIN SETUP COMPLETE!');
    console.log('   ✅ Jamaica super admin account ready');
    console.log('   ✅ Country isolation maintained');
    console.log('   🚀 Ready for Phase 7: Domain & Launch');

  } catch (error) {
    console.error('❌ Admin setup failed:', error);
  }
}

makeDarrenJamaicaAdmin();