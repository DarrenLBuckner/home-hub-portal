const { createClient } = require('@supabase/supabase-js');

// Create Supabase client (you'll need to add your actual keys here)
const supabaseUrl = 'https://opjnizbtppkynxzssijy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFixAdminAccess() {
  try {
    console.log('🔍 Checking profiles table...');
    
    // Get all profiles to see what's there
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    console.log('📊 Found profiles:', profiles.length);
    profiles.forEach(profile => {
      console.log(`- ID: ${profile.id}`);
      console.log(`  Email: ${profile.email || 'N/A'}`);
      console.log(`  User Type: ${profile.user_type || 'NOT SET'}`);
      console.log(`  Name: ${profile.first_name || 'N/A'} ${profile.last_name || 'N/A'}`);
      console.log('---');
    });
    
    // If no admin users exist, let's make one
    const adminUsers = profiles.filter(p => p.user_type === 'admin' || p.user_type === 'super_admin');
    
    if (adminUsers.length === 0) {
      console.log('🚨 No admin users found!');
      console.log('To fix this, provide your email and I will make you an admin.');
      console.log('Or run this manually in Supabase:');
      console.log('UPDATE profiles SET user_type = \'admin\' WHERE email = \'your-email@example.com\';');
      
      // If there's only one profile, make them admin
      if (profiles.length === 1) {
        const profile = profiles[0];
        console.log(`🔧 Making ${profile.email || 'user'} an admin...`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ user_type: 'admin' })
          .eq('id', profile.id);
        
        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
        } else {
          console.log('✅ Successfully made user admin!');
        }
      }
    } else {
      console.log('✅ Admin users found:', adminUsers.length);
      adminUsers.forEach(admin => {
        console.log(`- ${admin.email || 'N/A'} (${admin.user_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAndFixAdminAccess();