const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfileImageColumn() {
  console.log('Checking if profile_image column exists in profiles table...\n');
  
  // Try to query the profiles table
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, profile_image, company')
    .limit(5);
  
  if (error) {
    console.error('❌ Error querying profiles:', error.message);
    return;
  }
  
  console.log('✅ Successfully queried profiles table');
  console.log(`Found ${data.length} profiles\n`);
  
  // Check each profile
  data.forEach((profile, i) => {
    console.log(`Profile ${i + 1}:`);
    console.log(`  - Name: ${profile.first_name} ${profile.last_name}`);
    console.log(`  - profile_image: ${profile.profile_image || '(null)'}`);
    console.log(`  - company: ${profile.company || '(null)'}`);
    console.log('');
  });
  
  // Check Qumar specifically
  const { data: qumar, error: qumarError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, profile_image, company')
    .or('first_name.ilike.%qumar%,last_name.ilike.%torrington%')
    .limit(1)
    .single();
  
  if (qumarError) {
    console.error('❌ Error finding Qumar:', qumarError.message);
  } else if (qumar) {
    console.log('🔍 Qumar\'s Profile:');
    console.log(`  - ID: ${qumar.id}`);
    console.log(`  - Name: ${qumar.first_name} ${qumar.last_name}`);
    console.log(`  - Email: ${qumar.email}`);
    console.log(`  - profile_image: ${qumar.profile_image || '❌ NULL (this is the problem!)'}`);
    console.log(`  - company: ${qumar.company || '(null)'}`);
  }
}

checkProfileImageColumn().catch(console.error);
