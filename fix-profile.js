// Quick script to fix the profile user_type
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://opjnizbtppkynxzssijy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wam5pemJ0cHBreW54enNzaWp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ1MjQzNywiZXhwIjoyMDcwMDI4NDM3fQ.6HUlGNEBoRHCcO2N8EvJdjg3SmlcicnjYsNGU8VP0Sc';

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