const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkQumarUserType() {
  const { data: qumar, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('first_name', 'Qumar')
    .eq('last_name', 'Torrington')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Qumar\'s Full Profile:');
  console.log(JSON.stringify(qumar, null, 2));
  console.log('\n🔑 User Type:', qumar.user_type);
  console.log('📧 Email:', qumar.email);
  console.log('📸 Profile Image:', qumar.profile_image || '(null)');
}

checkQumarUserType();
