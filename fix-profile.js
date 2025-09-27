// Quick script to fix the profile user_type
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProfile() {
  console.log('Fixing profile for bucknermg@gmail.com...');
  
  // Update the profile to landlord type (using ID since email is null)
  const { data, error } = await supabase
    .from('profiles')
    .update({
      user_type: 'landlord',
      first_name: 'Darren',
      last_name: 'Buckner',
      phone: '31450256057',
      email: 'bucknermg@gmail.com',
      updated_at: new Date().toISOString(),
    })
    .eq('id', '5ca98eef-ef51-4c15-9855-ad34a2f08b04')
    .select();

  if (error) {
    console.error('Error updating profile:', error);
  } else {
    console.log('Profile updated successfully:', data);
  }
}

fixProfile();