// Debug authentication state
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://opjnizbtppkynxzssijy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wam5pemJ0cHBreW54enNzaWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ1MjQzNywiZXhwIjoyMDcwMDI4NDM3fQ.6HUlGNEBoRHCcO2N8EvJdjg3SmlcicnjYsNGU8VP0Sc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('=== DEBUGGING AUTHENTICATION STATE ===');
  
  // Check all users
  const { data: allUsers, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  console.log('\n1. ALL USERS:');
  allUsers.users.forEach(user => {
    console.log(`- ${user.email}: ID=${user.id}, metadata=${JSON.stringify(user.user_metadata)}`);
  });
  
  // Check profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, user_type, first_name, last_name')
    .order('created_at', { ascending: false });
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    return;
  }
  
  console.log('\n2. ALL PROFILES:');
  profiles.forEach(profile => {
    console.log(`- ID=${profile.id}, email=${profile.email}, user_type=${profile.user_type}, name=${profile.first_name} ${profile.last_name}`);
  });
  
  // Focus on our test user
  const targetUserId = '5ca98eef-ef51-4c15-9855-ad34a2f08b04';
  
  console.log('\n3. TARGET USER ANALYSIS:');
  console.log(`Target User ID: ${targetUserId}`);
  
  const targetUser = allUsers.users.find(u => u.id === targetUserId);
  if (targetUser) {
    console.log('✅ User exists in auth.users table');
    console.log(`   Email: ${targetUser.email}`);
    console.log(`   Confirmed: ${targetUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   User metadata: ${JSON.stringify(targetUser.user_metadata)}`);
  } else {
    console.log('❌ User NOT found in auth.users table');
  }
  
  const targetProfile = profiles.find(p => p.id === targetUserId);
  if (targetProfile) {
    console.log('✅ Profile exists in profiles table');
    console.log(`   Email: ${targetProfile.email}`);
    console.log(`   User type: ${targetProfile.user_type}`);
    console.log(`   Name: ${targetProfile.first_name} ${targetProfile.last_name}`);
  } else {
    console.log('❌ Profile NOT found in profiles table');
  }
  
  console.log('\n=== END DEBUG ===');
}

debugAuth().catch(console.error);