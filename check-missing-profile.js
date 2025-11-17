require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMissingProfile() {
  const userId = '70283da9-28c5-4dfb-ab43-b6086e5c3a16';
  
  console.log('🔍 Checking for orphaned properties...\n');
  
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  console.log('Profile exists:', !!profile);
  if (profileError) console.log('Profile error:', profileError);
  if (profile) console.log('Profile data:', profile);
  
  // Check properties
  const { data: props } = await supabase
    .from('properties')
    .select('id, title, status, user_id')
    .eq('user_id', userId);
  
  console.log('\n📦 Properties with this user_id:', props?.length);
  console.log('  Active:', props?.filter(p => p.status === 'active').length);
  
  // Check auth user
  const { data: authData } = await supabase.auth.admin.getUserById(userId);
  console.log('\n👤 Auth user exists:', !!authData.user);
  if (authData.user) {
    console.log('   Email:', authData.user.email);
    console.log('   Created:', authData.user.created_at);
  }
  
  // Check ALL profiles
  const { count } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  console.log('\n📊 Total profiles in database:', count);
}

checkMissingProfile().catch(console.error);
